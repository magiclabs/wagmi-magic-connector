export function normalizeChainId(chainId) {
    if (typeof chainId === 'string')
        return Number.parseInt(chainId, chainId.trim().startsWith('0x') ? 16 : 10);
    if (typeof chainId === 'bigint')
        return Number(chainId);
    return chainId;
}
