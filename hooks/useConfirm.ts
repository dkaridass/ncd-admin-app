import { useState, useCallback } from 'react';

interface ConfirmState {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
}

export function useConfirm() {
    const [state, setState] = useState<ConfirmState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const confirm = useCallback(
        (options: {
            title: string;
            message: string;
            confirmLabel?: string;
            cancelLabel?: string;
            variant?: 'danger' | 'warning' | 'info';
        }): Promise<boolean> => {
            return new Promise((resolve) => {
                setState({
                    isOpen: true,
                    ...options,
                    onConfirm: () => {
                        setState((prev) => ({ ...prev, isOpen: false }));
                        resolve(true);
                    },
                });
            });
        },
        []
    );

    const cancel = useCallback(() => {
        setState((prev) => ({ ...prev, isOpen: false }));
    }, []);

    return {
        confirmState: state,
        confirm,
        cancelConfirm: cancel,
    };
}
