# Web 2.22｜図鑑とペンギン

- エビ・カニ／貝・タコ・イカ／ヒトデ・ウニを展示上の「無脊椎動物」にまとめました。クラゲは独立表示です。厳密にはクラゲ・サンゴ・ホヤも無脊椎動物です。
- サンゴ・ホヤ・水草・海藻を展示上まとめました。サンゴとホヤは動物、水草・海藻は植物や藻類で、同じ生物分類ではありません。図鑑にも注記しています。
- No.266 フンボルト（1本の胸帯・顔のピンク）、267 ケープ（1本の胸帯・腹の斑点・目の周りの露出皮膚）、268 ガラパゴス（1本の胸帯・細い顔の白線）、269 コガタ（青い背・白い胸）を追加。既存マゼランは2本帯。ボクセルの制約上、模様を簡略化しています。
- 各種の同定・サイズ・分布の根拠は `data/expansion-216/curated-222.json` と `evidence.json`。GBIF accepted species と原典： https://animaldiversity.org/accounts/Spheniscus_humboldti/ 、https://www.penguinsinternational.org/african-penguins/ 、https://animaldiversity.org/accounts/Spheniscus_mendiculus/ 、https://animaldiversity.org/accounts/Eudyptula_minor/ 。
- 同じゲーム展示室に入れることは実際の混泳や飼育適合性を意味しません。生物や飼育は簡略化しています。
- 269/300種、サンゴ礁の削減は保留。Flutterには未移植、Android/iPhone実機未検証。

## 検証
- 単体テスト 95/95。390×844の隔離Chromiumで分類注記、4種の番号検索・お迎え・ペンギン水槽を確認。既存展示・探索・図鑑ブラウザテスト、保存バックアップ試験、探索バランス試算も通過。
- 本番保存を読み取り専用で互換検査し、revision 164・個体8体を保持。公開同期・配布ZIPから実保存を除外。
