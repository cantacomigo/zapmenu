// Largura máxima de 40 caracteres para impressoras térmicas de 80mm
const MAX_WIDTH = 40;

/**
 * Formata um valor monetário para o padrão brasileiro.
 */
export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
};

/**
 * Cria uma linha formatada com texto à esquerda e valor à direita, preenchendo o espaço com pontos.
 * @param leftText Texto da esquerda (ex: Subtotal)
 * @param rightText Texto da direita (ex: R$ 100,00)
 * @param fillChar Caractere de preenchimento (padrão: ' ')
 * @param maxWidth Largura máxima da linha (padrão: 40)
 */
export const padText = (leftText: string, rightText: string, fillChar: string = ' ', maxWidth: number = MAX_WIDTH): string => {
    // Remove formatação de moeda para contar caracteres corretamente
    const cleanLeft = leftText.replace(/R\$\s/g, '').trim();
    const cleanRight = rightText.replace(/R\$\s/g, '').trim();
    
    const totalLength = cleanLeft.length + cleanRight.length;
    
    if (totalLength >= maxWidth) {
        // Se for muito longo, apenas concatena e trunca se necessário
        return (leftText + ' ' + rightText).substring(0, maxWidth);
    }
    const padding = fillChar.repeat(maxWidth - totalLength);
    return leftText + padding + rightText;
};

export const separator = '-'.repeat(MAX_WIDTH);
export const doubleSeparator = '='.repeat(MAX_WIDTH);