export default interface filters_type {
    brands?: Record<string, boolean>;
    movement?: Record<string, boolean>;
    caseMaterial?: Record<string, boolean>;
    braceletMaterial?: Record<string, boolean>;
    dialColor?: Record<string, boolean>;

    condition: {
        New: boolean;
        "Pre-Owned": boolean;
    };
    caseDiameterMm: {
        min: number;
        max: number;
    };
    year: {
        min: number;
        max: number;
    };

    waterResistance: {
        min: number;
        max: number;
    };

    includes: {
        box: boolean;
        papers: boolean;
        firstInvoice: boolean;
        serviceInvoice: boolean;
    };
    price: {
        min: number;
        max: number;
    };
    availability: {
        inStock: boolean;
    };
}
