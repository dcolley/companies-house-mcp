// Basic setup test to verify project configuration

describe('Project Setup', () => {
  it('should have TypeScript compilation working', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });

  it('should have Jest running with TypeScript support', () => {
    const testString: string = 'Companies House MCP';
    expect(typeof testString).toBe('string');
    expect(testString).toContain('MCP');
  });

  it('should have environment variables accessible', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
