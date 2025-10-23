/**
 * リソース読み込み用URLを作成する(開発環境とサブディレクトリ環境の差異吸収)
 */
export const makePath = (path: string) => `${import.meta.env.BASE_URL}${path}`;
