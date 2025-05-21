const routes = {
	"releases": "GitHubから最新10件のリリース情報を取得します。",
	"asset": "GitHubから特定アセットのS3ダイレクトURLを取得します。",
	"default": "GitHubから最新10件のリリース情報を取得します。",
};

/**
 * GETリクエストを処理し、GitHubリリース情報をJSON形式で返します。
 *
 * @param {express.Request} req リクエストオブジェクト
 * @param {express.Response} res レスポンスオブジェクト
 * @returns {ContentService.TextOutput} GitHubリリース情報のJSONレスポンス。
 */
exports.importerFunction = (req, res) => {
    let route = req.query.route ?? "default";
    let response = null;
	const userAgent = req.headers['user-agent'];

    switch (route) {
		case "releases":
			response = GetReleases.handle();
			if (response.error) {
				response = { error: response.error };
				break;
			}
			console.log(response);
			break;
		case "asset":
			let owner = "RyuichiroYoshida";
			let repo = "SepDriveActions";
			let id = req.query.id || null;
			console.log(id);
			if (!id) {
				response = { error: "id parameter is required" };
				break;
			}

			response = GetS3AssetUrl.handle(owner, repo, id);
			if (response.error) {
				response = { error: response.error };
				break;
			}
			console.log(response);
			break;
		default:
			response = routes;
			break;
	}

	console.log(response);
	if (response) {
		return ContentService.createTextOutput(JSON.stringify(response));
	} else {
		return res.json({ error: "Invalid route" });
	}
}

const GetS3AssetUrl = (() => {
	/**
	 * 指定したGitHubリリースアセットのS3ダイレクトURLを取得します。
	 *
	 * @param {string} owner - GitHubリポジトリのオーナー名。
	 * @param {string} repo - GitHubリポジトリ名。
	 * @param {string|number} asset_id - リリースアセットのID。
	 * @returns {string} S3アセットへのリダイレクトURL。
	 */
	function handle(owner, repo, asset_id) {
		let url = `https://api.github.com/repos/${owner}/${repo}/releases/assets/${asset_id}`;

		const response = UrlFetchApp.fetch(url, {
			method: "get",
			headers: {
				Accept: "application/octet-stream",
				Authorization: "token " + PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN"),
			},
			followRedirects: false,
			muteHttpExceptions: true,
		});

		const redirectUrl = response.getHeaders()["Location"];
		return redirectUrl;
	}
	return { handle };
})();

const GetReleases = (() => {
	/**
	 * GitHubリポジトリの最新リリース情報を取得します。
	 *
	 * @function
	 * @returns {Array<Object>} フィルタ済みかつ公開日の降順でソートされた最新10件までのリリース情報の配列。
	 * 各リリースオブジェクトには以下のプロパティが含まれます:
	 *   - {number} id リリースID
	 *   - {string} name リリース名
	 *   - {string} tag_name タグ名
	 *   - {string} published_at 公開日時（ISO8601形式）
	 *   - {Array<Object>} assets アセット情報の配列（id, name, download_urlを含む）
	 * @throws {Error} リリース情報の取得に失敗した場合にエラーをスローします。
	 */
	function handle() {
		let owner = "RyuichiroYoshida";
		let repo = "SepDriveActions";
		let url = "https://api.github.com/repos/" + owner + "/" + repo + "/releases";
		let options = {
			method: "get",
			headers: {
				Accept: "application/vnd.github.v3+json",
				Authorization: "token " + PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN"),
			},
			followRedirects: false,
			muteHttpExceptions: true,
		};
		let response = UrlFetchApp.fetch(url, options);
		let releases = JSON.parse(response.getContentText());
		if (response.getResponseCode() !== 200) {
			throw new Error("Failed to fetch releases: " + response.getContentText());
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
	}
	return { handle };
})();
