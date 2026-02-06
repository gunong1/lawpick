
/**
 * PortOne Subscription Payment Logic
 * Based on User Work Order: Danal T-Pay / Monthly Subscription
 */

// User Code from Work Order
const USER_CODE = "imp02261832";

export interface SubscriptionParams {
    buyer_email: string;
    buyer_name: string;
    buyer_tel: string;
    amount?: number; // Default 4900
}

export const requestSubscription = (
    currentUser: SubscriptionParams,
    onSuccess: (response: any) => void,
    onError: (errorMsg: string) => void
) => {
    if (typeof window === "undefined" || !window.IMP) {
        onError("결제 모듈이 로드되지 않았습니다.");
        return;
    }

    const { IMP } = window;
    IMP.init(USER_CODE);

    // 1. 주문번호 생성
    const merchantUid = `lawpick_${new Date().getTime()}`;
    // 2. 빌링키 발급용 ID (예: phone 번호 활용하거나 랜덤)
    // Note: 실무에서는 DB의 User ID를 사용해야 함. 
    // 여기서는 전화번호 뒷자리 등을 임시로 사용하거나, 인자로 받아야 함.
    // 임시로 timestamp 사용 (실제 연동 시 수정 필요)
    const customerUid = `user_${currentUser.buyer_tel}_billing_${new Date().getTime()}`;

    IMP.request_pay(
        {
            pg: "danal_tpay", // 다날 일반/정기 결제
            pay_method: "card",
            merchant_uid: merchantUid,
            customer_uid: customerUid, // [핵심] 빌링키 발급 파라미터
            name: "로픽 프리미엄 멤버십 (월 4,900원)",
            amount: currentUser.amount || 4900,
            buyer_email: currentUser.buyer_email,
            buyer_name: currentUser.buyer_name,
            buyer_tel: currentUser.buyer_tel,
        },
        (rsp) => {
            if (rsp.success) {
                onSuccess(rsp);
            } else {
                onError(rsp.error_msg || "결제에 실패했습니다.");
            }
        }
    );
};
