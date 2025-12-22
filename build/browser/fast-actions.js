// CDP session cache per page
const cdpSessions = new WeakMap();
const isMac = process.platform === 'darwin';
// Get or create CDP session for direct browser communication
async function getCDPSession(page) {
    let session = cdpSessions.get(page);
    if (!session) {
        session = await page.context().newCDPSession(page);
        cdpSessions.set(page, session);
    }
    return session;
}
// Fast click using CDP - bypasses Playwright's actionability checks
// Use when element visibility was already verified from snapshot
export async function fastClick(page, x, y, options) {
    const cdp = await getCDPSession(page);
    const button = options?.button ?? 'left';
    const clickCount = options?.clickCount ?? 1;
    // Map button name to CDP button code
    const buttonMap = { left: 0, middle: 1, right: 2 };
    const buttonCode = buttonMap[button];
    // Dispatch mouse events directly via CDP
    for (let i = 0; i < clickCount; i++) {
        await cdp.send('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            x,
            y,
            button,
            clickCount: i + 1,
            buttons: 1 << buttonCode,
        });
        await cdp.send('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            x,
            y,
            button,
            clickCount: i + 1,
        });
    }
}
// Fast type using CDP insertText - instant text insertion
// Much faster than character-by-character typing
export async function fastType(page, text, options) {
    const cdp = await getCDPSession(page);
    // Clear existing text if requested
    if (options?.clear !== false) {
        const selectAllModifier = isMac ? 4 : 2; // Meta on macOS, Ctrl elsewhere
        // Select all and delete
        await cdp.send('Input.dispatchKeyEvent', {
            type: 'keyDown',
            modifiers: selectAllModifier,
            key: 'a',
            code: 'KeyA',
            windowsVirtualKeyCode: 65,
        });
        await cdp.send('Input.dispatchKeyEvent', {
            type: 'keyUp',
            modifiers: selectAllModifier,
            key: 'a',
            code: 'KeyA',
            windowsVirtualKeyCode: 65,
        });
    }
    // Insert text instantly (no character-by-character simulation)
    await cdp.send('Input.insertText', { text });
}
// Fast keyboard event
export async function fastKeyPress(page, key) {
    const cdp = await getCDPSession(page);
    // Map common keys
    const keyMap = {
        Enter: { code: 'Enter', keyCode: 13 },
        Tab: { code: 'Tab', keyCode: 9 },
        Escape: { code: 'Escape', keyCode: 27 },
        Backspace: { code: 'Backspace', keyCode: 8 },
        Delete: { code: 'Delete', keyCode: 46 },
        ArrowUp: { code: 'ArrowUp', keyCode: 38 },
        ArrowDown: { code: 'ArrowDown', keyCode: 40 },
        ArrowLeft: { code: 'ArrowLeft', keyCode: 37 },
        ArrowRight: { code: 'ArrowRight', keyCode: 39 },
    };
    const keyInfo = keyMap[key] || { code: `Key${key.toUpperCase()}`, keyCode: key.charCodeAt(0) };
    await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key,
        code: keyInfo.code,
        windowsVirtualKeyCode: keyInfo.keyCode,
    });
    await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key,
        code: keyInfo.code,
        windowsVirtualKeyCode: keyInfo.keyCode,
    });
}
// Fast scroll using CDP
export async function fastScroll(page, deltaX, deltaY, x, y) {
    const cdp = await getCDPSession(page);
    // Default to center of viewport
    const viewport = page.viewportSize() || { width: 1280, height: 720 };
    const scrollX = x ?? viewport.width / 2;
    const scrollY = y ?? viewport.height / 2;
    await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseWheel',
        x: scrollX,
        y: scrollY,
        deltaX,
        deltaY,
    });
    // Small delay to allow scroll to complete
    await new Promise(resolve => setTimeout(resolve, 50));
}
// Focus element at position using CDP
export async function fastFocus(page, x, y) {
    const cdp = await getCDPSession(page);
    // Click to focus
    await cdp.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x,
        y,
        button: 'left',
        clickCount: 1,
    });
    await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x,
        y,
        button: 'left',
    });
}
// Clean up CDP session when page closes
export function cleanupCDPSession(page) {
    cdpSessions.delete(page);
}
//# sourceMappingURL=fast-actions.js.map