// Largura máxima de 40 caracteres para impressoras térmicas de 80mm
const MAX_WIDTH = 40;

/**
 * Formata um valor monetário para o padrão brasileiro.
 */
export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
};

/**
 * Cria uma linha formatada com texto à esquerda e valor à direita, preenchendo o espaço com o caractere de preenchimento.
 * @param leftText Texto da esquerda (ex: Subtotal)
 * @param rightText Texto da direita (ex: R$ 100,00)
 * @param fillChar Caractere de preenchimento (padrão: ' ')
 * @param maxWidth Largura máxima da linha (padrão: 40)
 */
export const padText = (leftText: string, rightText: string, fillChar: string = ' ', maxWidth: number = MAX_WIDTH): string => {
    // Usamos o comprimento bruto das strings, pois a fonte é monoespaçada.
    const totalLength = leftText.length + rightText.length;
    
    if (totalLength >= maxWidth) {
        // Se for muito longo, trunca a esquerda para garantir que o preço caiba.
        const availableSpaceForLeft = maxWidth - rightText.length;
        const truncatedLeft = leftText.substring(0, availableSpaceForLeft);
        return truncatedLeft + rightText;
    }
    
    const padding = fillChar.repeat(maxWidth - totalLength);
    return leftText + padding + rightText;
};

export const separator = '-'.repeat(MAX_WIDTH);
export const doubleSeparator = '='.repeat(MAX_WIDTH);