const express = require("express");
const fetch = require("node-fetch");

const routes = {
	releases: "GitHubから最新10件のリリース情報を取得します。",
	asset: "GitHubから特定アセットのS3ダイレクトURLを取得します。",
	default: "GitHubから最新10件のリリース情報を取得します。",
};

const app = express();
app.get("/", (req, res) => {
	res.send(routes);
});

app.get("/asset", async (req, res) => {
	try {
		let owner = "RyuichiroYoshida";
		let repo = "SepDriveActions";
		let asset_id = req.query.id || null;
		console.log(asset_id);

		const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${asset_id}`, {
			headers: {
				"User-Agent": "node.js",
				Accept: "application/octet-stream",
				Authorization: "token " + process.env.GITHUB_TOKEN,
			},
			redirect: "manual",
			muteHttpExceptions: true,
		});

        if (response.status === 302) {
            const location = response.headers.get("location");
            return res.json({ url: location });
        } else if (response.status === 200) {
            // ファイルバイナリが返ってきた場合
            res.setHeader("Content-Type", response.headers.get("content-type") || "application/octet-stream");
            res.setHeader("Content-Disposition", response.headers.get("content-disposition") || "attachment");
            response.body.pipe(res);
        } else {
            const text = await response.text();
            throw new Error("Failed to fetch asset: " + response.statusText + " " + text);
        }
	} catch (error) {
		console.error("Error fetching asset:", error);
		res.send({ error: "Failed to fetch asset" });
	}
});

app.get("/releases", async (req, res) => {
	try {
		let owner = "RyuichiroYoshida";
		let repo = "SepDriveActions";

		const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
			headers: {
				"User-Agent": "node.js",
				Accept: "application/vnd.github.v3+json",
				Authorization: "token " + process.env.GITHUB_TOKEN,
			},
			followRedirects: false,
			muteHttpExceptions: true,
		});

		if (response.getResponseCode() !== 200) {
			throw new Error("Failed to fetch releases: " + response);
		}
		let releases = await response.json();

		// リリース情報をフィルタリングして、公開されているものだけを取得
		releases.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

		// 10件までのリリースを取得
		releases = releases.slice(0, 10);

		let releasesResult = releases.map((release) => ({
			// 各リリースごとに必要な情報だけを抽出して新しいオブジェクトを作成します
			id: releases.id, // リリースID
			name: releases.name, // リリース名
			tag_name: releases.tag_name, // タグ名
			published_at: releases.published_at, // 公開日時
			assets: releases.assets.map((asset) => ({
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
		res.send(releasesResult);
	} catch (error) {
		console.error("Error fetching releases:", error);
		res.send({ error: "Failed to fetch releases" });
	}
});

exports.importFunction = app;
