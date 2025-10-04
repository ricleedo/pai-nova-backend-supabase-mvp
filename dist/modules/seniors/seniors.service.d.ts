export declare class SeniorsService {
    getAllSeniors(userId: string, userRole: string, page?: number, limit?: number): Promise<{
        seniors: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getSeniorById(seniorId: string, userId: string, userRole: string): Promise<any>;
    createSenior(data: any, createdBy: string): Promise<any>;
    updateSenior(seniorId: string, data: any, userId: string, userRole: string): Promise<any>;
    deleteSenior(seniorId: string, userId: string): Promise<{
        message: string;
    }>;
    assignCaregiver(seniorId: string, caregiverId: string, relationship: string, permissions: any): Promise<any>;
}
declare const _default: SeniorsService;
export default _default;
//# sourceMappingURL=seniors.service.d.ts.map