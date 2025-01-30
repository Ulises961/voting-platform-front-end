export const validateProposal = (title: string, description: string): boolean => {
    if (!title || title.trim().length === 0) {
        return false;
    }
    if (!description || description.trim().length === 0 || description.length > 500) {
        return false;
    }
    return true;
};

export const sanitizeInput = (input: string): string => {
    const element = document.createElement('div');
    element.innerText = input;
    return element.innerHTML;
};