UNITY_VERSION=6000.0.41f1
UNITY_EDITOR_PATH=/Applications/Unity/Hub/Editor/
PROJECT_PATH=/Users/vantan/Documents/GitHub/September
EXPORT_PATH=/Users/vantan/Library/CloudStorage/GoogleDrive-projectsepmtember2025@gmail.com/マイドライブ/September/Builds
LOG_FILE=$PROJECT_PATH/log/Sep.log
GIT_URL=https://github.com/RyuichiroYoshida/September.git

# 出力フォルダを処理のたびに削除する
if [ -e "$PROJECT_PATH/Build" ]; then
    rm -rf "$PROJECT_PATH/Build"
fi

# プロジェクト更新
cd $PROJECT_PATH
git pull $GIT_URL

if [ $? -eq 1 ]; then
    echo "プロジェクトの更新に失敗しました"
    exit 1
fi

# Unityビルドコマンドを実行する
"$UNITY_EDITOR_PATH$UNITY_VERSION/Unity.app/Contents/MacOS/Unity" -batchmode -quit -projectPath "$PROJECT_PATH" -executeMethod "BuildCommand.Build" -clean -logfile "$LOG_FILE" -platform "Mac" -devmode true -outputPath "$PROJECT_PATH/Build"
if [ $? -eq 1 ]; then
    cat "$LOG_FILE"
    exit 1
fi

# プロジェクトフォルダに移動
cd "$PROJECT_PATH"

# ビルドファイルを圧縮
zip -r -o MacBuild.zip Build/

if [ $? -eq 1 ]; then
    exit 1
fi

# Google Driveへ移動
mv "$PROJECT_PATH/MacBuild.zip" "$EXPORT_PATH"