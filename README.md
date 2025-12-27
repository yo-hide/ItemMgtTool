# アイテム管理ツール (Item Mgt Tool)

ユーザーごとのアイテム（グローブ、時間短縮アイテムなど）を管理するためのWebアプリケーションです。
アイテムの使用、有効期限の管理、期限切れアイテムの自動削除などの機能を提供します。

## 機能
- **ユーザー管理**: ユーザーの追加、名前変更、削除
- **アイテム管理**:
  - グローブ (🥊) の付与
  - 有効期限の管理（取得から5日間など）
  - 残り時間のリアルタイム表示
- **アクション**:
  - アイテムの使用（消費）
  - 期限切れアイテムの一括削除

## 技術スタック
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Utils**: date-fns

## 開発の始め方

開発サーバーを起動します:

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認できます。

## デプロイ
このプロジェクトは Google Cloud Run にデプロイされるように構成されています。
GitHub の `main` ブランチにプッシュすると、Cloud Build と GitHub Actions を通じて自動的にデプロイされます。
