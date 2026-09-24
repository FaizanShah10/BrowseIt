export type VisitMethod = "typed" | "link" | "search" | "history";

export type Person = {
  _id: string;
  name: string;
  createdAt: Date;
};

export type Site = {
  _id: string;
  address: string;
  title: string;
  html: string;
  textContent: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Visit = {
  _id: string;
  personId: string;
  address: string;
  siteId: string | null;
  method: VisitMethod;
  fromVisitId: string | null;
  createdAt: Date;
};

export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
};
