export interface Sell {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    intent: "sell";
    brand: string;
    price: number;
    condition: "new" | "mint" | "pre-owned";
    images: any;
    model?: string | undefined;
    refNum?: string | undefined;
    box?: boolean | undefined;
    papers?: boolean | undefined;
    message?: string | undefined;
    handled?: boolean;
    created_at?: Date | string;
    id:string
}
