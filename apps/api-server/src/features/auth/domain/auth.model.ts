import type { User } from "@nmm/shared";

export type UserRecord = User;

export type ActiveUser = User & {
    name: string;
    status: "ACTIVE";
};
