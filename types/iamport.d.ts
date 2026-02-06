export { };

declare global {
    interface Window {
        IMP: Iamport;
    }
}

export interface Iamport {
    init: (accountID: string) => void;
    request_pay: (
        params: IamportPaymentParams,
        callback?: (response: IamportResponse) => void
    ) => void;
}

export interface IamportPaymentParams {
    pg: string;
    pay_method: string;
    merchant_uid: string;
    name?: string;
    amount: number;
    buyer_email?: string;
    buyer_name?: string;
    buyer_tel?: string;
    buyer_addr?: string;
    buyer_postcode?: string;
    m_redirect_url?: string; // 모바일 리다이렉트 URL
    customer_uid?: string; // 정기결제 빌링키 발급용
}

export interface IamportResponse {
    success: boolean;
    error_code?: string;
    error_msg?: string;
    imp_uid?: string;
    merchant_uid: string;
    pay_method?: string;
    paid_amount?: number;
    status?: string;
    name?: string;
    pg_provider?: string;
    emb_pg_provider?: string;
    pg_tid?: string;
    buyer_name?: string;
    buyer_email?: string;
    buyer_tel?: string;
    buyer_addr?: string;
    buyer_postcode?: string;
    custom_data?: any;
    paid_at?: number;
    receipt_url?: string;
}
