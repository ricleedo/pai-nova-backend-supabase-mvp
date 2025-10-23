interface SendMagicLinkParams {
    to: string;
    frontendLink?: string;
    backendLink: string;
    purpose: 'verify' | 'signin';
}
export declare function sendMagicLinkEmail({ to, frontendLink, backendLink, purpose }: SendMagicLinkParams): Promise<void>;
declare const _default: {
    sendMagicLinkEmail: typeof sendMagicLinkEmail;
};
export default _default;
//# sourceMappingURL=email.service.d.ts.map