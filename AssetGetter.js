const https = require("https");
const express = require("express");

const routes = {
	releases: "GitHubから最新10件のリリース情報を取得します。",
	asset: "GitHubから特定アセットのS3ダイレクトURLを取得します。",
	default: "GitHubから最新10件のリリース情報を取得します。",
};

const app = express();
app.get("/", (req, res) => {
	res.send(routes);
});

app.get("/asset", (req, res) => {
	try {
		let owner = "RyuichiroYoshida";
		let repo = "SepDriveActions";
		let asset_id = req.query.id || null;
		console.log(asset_id);

		const opt = {
			protocol: "https:",
			hostname: "api.github.com",
			path: `/repos/${owner}/${repo}/releases/assets/${asset_id}`,
			method: "GET",
			headers: {
				Accept: "application/octet-stream",
				Authorization: "token " + process.env.GITHUB_TOKEN,
			},
			followRedirects: false,
			muteHttpExceptions: true,
		};
		const res = new Promise((resolve, reject) => {
			const req = https.get(opt, (res) => {
				res.on("data", (chunk) => {
					// 受信したデータを処理する
					console.log(`Received chunk: ${chunk}`);
				});
				res.on("end", () => {
					// リクエストが完了したときの処理
					console.log("Request completed.");
				});
				req.end();
				req.on("error", (error) => {
					reject(error);
					console.error("Error:", error);
				});
			});
			res.resolve((response) => {
				return res;
			});
		});
	} catch (error) {
		reject(error);
		console.error("Error fetching S3 asset URL:", error);
		return { error: "Failed to fetch S3 asset URL" };
	}
});

app.get("/releases", async(req, res) => {
	try {
		let owner = "RyuichiroYoshida";
		let repo = "SepDriveActions";

		const opt = {
			protocol: "https:",
			hostname: "api.github.com",
			path: `/repos/${owner}/${repo}/releases`,
			method: "GET",
			headers: {
				Accept: "application/vnd.github.v3+json",
				Authorization: "token " + process.env.GITHUB_TOKEN,
			},
			followRedirects: false,
			muteHttpExceptions: true,
		};

		const response = new Promise((resolve, reject) => {
			const req = https.get(opt, (res) => {
				res.on("data", (chunk) => {
					// 受信したデータを処理する
					console.log(`Received chunk: ${chunk}`);
				});
				res.on("end", () => {
					// リクエストが完了したときの処理
					console.log("Request completed.");
				});
				req.end();
				req.on("error", (error) => {
					reject(error);
					console.error("Error:", error);
				});
				res.resolve((r) => {
					return r;
				});
			});
		});

		let releases = response;

		if (response.getResponseCode() !== 200) {
			throw new Error("Failed to fetch releases: " + response);
		}

		// リリース情報をフィルタリングして、公開されているものだけを取得
		releases.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

		// 10件までのリリースを取得
		releases = releases.slice(0, 10);

		let releasesResult = releases.map((release) => ({
			// 各リリースごとに必要な情報だけを抽出して新しいオブジェクトを作成します
			id: release.id, // リリースID
			name: release.name, // リリース名
			tag_name: release.tag_name, // タグ名
			published_at: release.published_at, // 公開日時
			assets: release.assets.map((asset) => ({
				// 各リリースのアセット情報も同様に必要な情報だけ抽出します
				id: asset.id, // アセットID
				name: asset.name, // アセット名
				download_url: asset.browser_download_url, // ダウンロードURL
				size: asset.size, // アセットサイズ
			})),
		}));

		releasesResult.forEach((release) => {
			console.log(release);
		});
		return releasesResult;
	} catch (error) {
		console.error("Error fetching releases:", error);
		return { error: "Failed to fetch releases" };
	}
});

exports.importFunction = app;
