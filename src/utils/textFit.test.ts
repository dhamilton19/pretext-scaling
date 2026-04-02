import { fitTitleAndBody } from './textFit';
import * as pretext from '@chenglou/pretext';

// Mock the pretext library
jest.mock('@chenglou/pretext', () => ({
  prepare: jest.fn(),
  prepareWithSegments: jest.fn(),
  layout: jest.fn(),
  layoutNextLine: jest.fn(),
  walkLineRanges: jest.fn(),
}));

describe('fitTitleAndBody', () => {
  const originalWindow = global.window;

  beforeAll(() => {
    if (typeof window === 'undefined') {
      (global as any).window = {};
    }
  });

  afterAll(() => {
    if (originalWindow === undefined) {
      delete (global as any).window;
    } else {
      (global as any).window = originalWindow;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fits both title and body if space allows', () => {
    (pretext.layout as jest.Mock)
      .mockReturnValueOnce({ height: 20, lineCount: 1 })
      .mockReturnValueOnce({ height: 20, lineCount: 1 });

    const result = fitTitleAndBody('Title', 'Body', 'Inter', 100, 100, 20, 15, 1.2);
    
    expect(result.isTitleTruncated).toBe(false);
    expect(result.isBodyRemoved).toBe(false);
    expect(result.titleText).toBe('Title');
    expect(result.bodyText).toBe('Body');
  });

  it('removes body if title takes up all space', () => {
    (pretext.layout as jest.Mock).mockReturnValueOnce({ height: 120, lineCount: 5 });

    (pretext.walkLineRanges as jest.Mock).mockImplementation((prep: any, maxW: any, cb: any) => {
      cb({ width: 15 });
    });

    (pretext.layoutNextLine as jest.Mock)
      .mockReturnValueOnce({ text: 'Title ', end: { segmentIndex: 0, graphemeIndex: 5 } })
      .mockReturnValueOnce(null);

    const result = fitTitleAndBody('Title that is too long', 'Body', 'Inter', 100, 100, 20, 15, 1.2);
    
    expect(result.isTitleTruncated).toBe(true);
    expect(result.isBodyRemoved).toBe(true);
    expect(result.titleText).toBe('Title...');
    expect(result.bodyText).toBe('');
  });

  it('removes body if title fits but not enough space for body', () => {
    (pretext.layout as jest.Mock).mockReturnValueOnce({ height: 80, lineCount: 4 });

    const result = fitTitleAndBody('Title', 'Body', 'Inter', 100, 100, 20, 20, 1.2);
    
    expect(result.isTitleTruncated).toBe(false);
    expect(result.isBodyRemoved).toBe(true);
    expect(result.titleText).toBe('Title');
    expect(result.bodyText).toBe('');
    
    expect(pretext.layout).toHaveBeenCalledTimes(1);
  });

  it('removes body if body requires more space than remaining height', () => {
    (pretext.layout as jest.Mock)
      .mockReturnValueOnce({ height: 40, lineCount: 2 })
      .mockReturnValueOnce({ height: 80, lineCount: 4 });

    const result = fitTitleAndBody('Title', 'Long body', 'Inter', 100, 100, 20, 15, 1.2);
    
    expect(result.isTitleTruncated).toBe(false);
    expect(result.isBodyRemoved).toBe(true);
    expect(result.titleText).toBe('Title');
    expect(result.bodyText).toBe('');
    
    expect(pretext.layout).toHaveBeenCalledTimes(2);
  });

  it('returns early with default text if window is undefined (SSR)', () => {
    const tempWindow = global.window;
    delete (global as any).window;

    const result = fitTitleAndBody('SSR Title', 'SSR Body', 'Inter', 100, 100, 20, 15, 1.2);
    
    expect(result.isTitleTruncated).toBe(false);
    expect(result.isBodyRemoved).toBe(false);
    expect(result.titleText).toBe('SSR Title');
    expect(result.bodyText).toBe('SSR Body');
    expect(pretext.prepare).not.toHaveBeenCalled();

    (global as any).window = tempWindow;
  });
});