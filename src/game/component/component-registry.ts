// 各クラスの static typeId をキーにして戻り値の型を自動的に絞る辞書
// 定義時は空で、各 Component が各々の定義を追加する

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ComponentRegistry {
}

export type ComponentTypeId = keyof ComponentRegistry;  // unique symbol の union
export type ComponentById<T extends ComponentTypeId> = ComponentRegistry[T];
