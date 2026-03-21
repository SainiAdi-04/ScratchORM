export type WhereClause<T> = {
  [K in keyof T]?: T[K];
};

export type SelectClause<T> = {
  [K in keyof T]?: boolean;
};

export interface FindManyOptions<T> {
  where?: WhereClause<T>;
  select?: SelectClause<T>;
  orderBy?: { field: keyof T; direction: "asc" | "desc" };
  limit?: number;
}

export interface FindOneOptions<T> {
  where: WhereClause<T>;
  select?: SelectClause<T>;
}
