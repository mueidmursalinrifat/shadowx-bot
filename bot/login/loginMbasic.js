"use strict";

const cheerio = require("cheerio");
let totpGenerator = require("totp-generator");
if (typeof totpGenerator !== "function") {
	totpGenerator = function (secret) {
		return totpGenerator.TOTP.generate(secret).otp;
	};
}
const requestPromise = require("request-promise");
const BASE_URL = "https://mbasic.facebook.com/";
const defaultHeaders = {
	accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
	"accept-language": "vi,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
	"sec-ch-ua": "\"\"",
	"sec-ch-ua-mobile": "?1",
	"sec-ch-ua-platform": "\"\"",
	"sec-fetch-dest": "document",
	"sec-fetch-mode": "navigate",
	"sec-fetch-site": "none",
	"sec-fetch-user": "?1",
	"upgrade-insecure-requests": "1",
	origin: "https://mbasic.facebook.com",
	"user-agent": "Mozilla/5.0 (Linux; Android 12; M2102J20SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Mobile Safari/537.36"
};

async function loginMbasic({
	email,
	pass,
	twoFactorSecretOrCode,
	userAgent,
	proxy,
	maxTry = 3,
	currentTry = 0
}) {
	if (userAgent) {
		defaultHeaders["user-agent"] = userAgent;
	}

	const requestOptions = {
		headers: defaultHeaders,
		simple: false,
		jar: true
	};
	if (proxy) {
		requestOptions.proxy = proxy;
	}

	const rp = requestPromise.defaults(requestOptions);
	const request = (opts) => new Promise((resolve, reject) => {
		rp(opts, (err, res) => {
			if (err) {
				return reject(err);
			}
			resolve(res);
		});
	});

	const cookieJar = requestPromise.jar();
	cookieJar.setCookie("locale=en_US;", BASE_URL);

	let response = await request({
		method: "GET",
		url: BASE_URL,
		jar: cookieJar
	});

	let $ = cheerio.load(response.body);
	let form = "li try_number lsd jazoest m_ts unrecognized_tries bi_xrwh"
		.split(" ")
		.reduce((acc, name) => {
			acc[name] = $(`input[name='${name}']`).val();
			return acc;
		}, {});

	form.login = $("#login_form input[name='login']").val();
	form.pass = pass;
	form.email = email;

	let action = $("#login_form").attr("action");
	response = await request({
		method: "POST",
		url: "https://mbasic.facebook.com" + action,
		jar: cookieJar,
		form
	});

	const location = response.headers.location;
	if (location) {
		const redirect = await request({
			method: "GET",
			url: location,
			jar: cookieJar
		});

		if (
			redirect.body.includes("facebook_login_pw_error") ||
			redirect.body.includes("The password that you entered is incorrect")
		) {
			const err = new Error("Password is incorrect");
			err.name = "PASSWORD_INCORRECT";
			throw err;
		}

		if (redirect.body.includes("Sorry, something went wrong.")) {
			if (currentTry >= maxTry) {
				const err = new Error("Sorry, something went wrong. Retry login...");
				err.name = "MAX_TRY_REACHED";
				throw err;
			}
			return loginMbasic({
				email,
				pass,
				twoFactorSecretOrCode,
				userAgent,
				proxy,
				maxTry,
				currentTry: currentTry + 1
			});
		}

		if (redirect.body.includes("Have a code sent to your email address")) {
			const err = new Error("Have a code sent to your email address");
			err.name = "CODE_SENT_TO_EMAIL";
			throw err;
		}

		const $redirect = cheerio.load(redirect.body);
		if ($redirect("input[name='approvals_code']").length > 0) {
			if (!twoFactorSecretOrCode) {
				const err = new Error("2FA code is required but not provided");
				err.name = "2FA_CODE_REQUIRED";
				throw err;
			}

			let code;
			if (twoFactorSecretOrCode.length >= 32) {
				code = totpGenerator(twoFactorSecretOrCode.replace(/\s/g, ""));
			} else {
				code = twoFactorSecretOrCode;
			}

			const twoFactorForm = "fb_dtsg;jazoest;checkpoint_data;codes_submitted;submit[Submit Code];nh"
				.split(";")
				.reduce((acc, name) => {
					acc[name] = $redirect(`input[name='${name}']`).val();
					return acc;
				}, {});
			twoFactorForm.approvals_code = code;

			const twoFactorAction = $redirect("form[method='post']").first().attr("action");
			response = await request({
				method: "POST",
				url: "https://mbasic.facebook.com" + twoFactorAction,
				jar: cookieJar,
				form: twoFactorForm
			});
		} else {
			const checkpointHref = redirect.request.uri.href;
			if (checkpointHref.match(/checkpoint\/\d+\//)) {
				const err = new Error("Your account is locked, please verify your identity");
				err.name = "CHECKPOINT_REQUIRED";
				err.checkpointUrl = email;
				err.cookies = cookieJar.getCookies(BASE_URL);
				throw err;
			}
			if (redirect.headers.location && redirect.headers.location.match && redirect.headers.location.match(/checkpoint\/\d+\//)) {
				const err = new Error("Your account is locked, please verify your identity");
				err.name = "CHECKPOINT_REQUIRED";
				err.checkpointUrl = redirect.headers.location;
				throw err;
			}
		}
	}

	checkpointLoop:
	for (;;) {
		const $page = cheerio.load(response.body);
		const continueBtn = $page("input[name='submit[Continue]']");
		const thisWasMeBtn = $page("input[name='submit[This was me]']");
		if (continueBtn.length <= 0 && thisWasMeBtn.length <= 0) {
			break checkpointLoop;
		}

		const formEl = $page("form[method='post']").first();
		const nextForm = {};
		formEl.find("input").toArray().forEach((el) => {
			const $el = $page(el);
			const name = $el.attr("name");
			if ($el.attr("type") === "radio") {
				const checked = $page(`input[name='${name}']:checked`);
				if (checked.length > 0) {
					nextForm[name] = checked.val();
				}
			} else {
				nextForm[name] = $el.val();
			}
		});

		for (const key of ["submit[logout-button-with-confirm]", "submit[This wasn't me]", "undefined"]) {
			delete nextForm[key];
		}

		response = await request({
			method: "POST",
			url: "https://mbasic.facebook.com" + formEl.attr("action"),
			jar: cookieJar,
			form: nextForm
		});
	}

	const cookies = cookieJar.getCookies(BASE_URL);
	const cookieHeader = cookies.map((c) => `${c.key}=${c.value}`).join("; ");
	const meUrl = (await request({
		method: "GET",
		url: "https://mbasic.facebook.com/me",
		headers: {
			cookie: cookieHeader
		}
	})).request.uri.href;

	if (meUrl.match(/checkpoint\/\d+\//)) {
		const err = new Error("Your account is locked, please verify your identity");
		err.name = "CHECKPOINT_REQUIRED";
		err.checkpointUrl = meUrl;
		throw err;
	}

	return cookies.map((c) => ({
		name: c.key,
		value: c.value,
		domain: "facebook.com",
		path: "/",
		hostOnly: false,
		creation: new Date().toISOString(),
		lastAccessed: new Date().toISOString()
	}));
}

module.exports = loginMbasic;
