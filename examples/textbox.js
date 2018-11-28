var mod_draw = require('../');

var draw = new mod_draw.Draw({});
var screen = new mod_draw.controls.Layout({
    border: true
});
var box = new mod_draw.Region({});
var lines = [ '' ];

/*
 * "offset" represents where we're positioned within the entered text, while
 * "corner" represents where we start drawing (ergo, what's visible).
 */
var offset = {
    x: 0,
    y: 0
};
var corner = {
    x: 0,
    y: 0
}

screen.add(box, {
    label: 'Enter your text!'
});

function drawBox() {
    var width = box.width();
    var height = box.height();

    box.clear();

    if (offset.y < corner.y) {
        /* We've moved above the visible region. */
        corner.y = offset.y;
    } else if (offset.y >= corner.y + height) {
        /* We've moved below the visible region. */
        corner.y = offset.y - height + 1;
    }

    if (offset.x < corner.x) {
        /* We've moved left of the visible region. */
        corner.x = offset.x;
    } else if (offset.x >= corner.x + width) {
        /* We've moved right of the visible region. */
        corner.x = offset.x - width + 1;
    }

    for (var i = 0; i < height; i++) {
        if (corner.y + i >= lines.length) {
            break;
        }
        box.str(0, i, lines[corner.y + i].slice(corner.x, corner.x + width));
    }
}

function type(key) {
    var line = lines[offset.y];
    lines[offset.y] = line.slice(0, offset.x) + key + line.slice(offset.x);
    offset.x += 1;
}

function newline() {
    var line = lines[offset.y];
    var a = line.slice(0, offset.x);
    var b = line.slice(offset.x);
    lines[offset.y] = a;
    lines.splice(offset.y + 1, 0, b)
    offset.x = 0;
    offset.y = offset.y + 1;
}

function backspace() {
    if (offset.x !== 0) {
        /* Simple case within a line. */
        var line = lines[offset.y];
        lines[offset.y] = line.slice(0, offset.x - 1) + line.slice(offset.x);
        offset.x -= 1;
        return;
    }

    if (offset.y === 0) {
        /* Backspace at (0,0); nothing to do! */
        return;
    }

    /* Join two lines together. */
    offset.x = lines[offset.y - 1].length;
    lines.splice(offset.y - 1, 2, lines[offset.y - 1] + lines[offset.y]);
    offset.y -= 1;
}

function moveX(dir) {
    var noff = {
        x: offset.x + dir,
        y: offset.y
    };

    if (noff.x < 0) {
        if (offset.y > 0) {
            /*
             * We're at the start of a line, so we'll move to the end of the
             * previous line.
             */
            noff = {
                x: lines[offset.y - 1].length,
                y: offset.y - 1
            };
        } else {
            noff = offset;
        }
    } else if (noff.x > lines[offset.y].length) {
        if (offset.y < lines.length - 1) {
            /*
             * We're at the end of a line, so we'll move to the start of the
             * next line.
             */
            noff = {
                x: 0,
                y: offset.y + 1
            };
        } else {
            noff = offset;
        }
    }

    offset = noff;
}

function moveY(dir) {
    var noff = {
        x: offset.x,
        y: offset.y + dir
    };

    if (noff.y < 0 || noff.y >= lines.length) {
        noff = offset;
        return;
    }
    
    if (noff.x > lines[noff.y].length) {
        noff.x = lines[noff.y].length;
    }

    offset = noff;
}

box.on('resize', drawBox);

function redraw() {
    var x = offset.x - corner.x;
    var y = offset.y - corner.y;
    draw.redraw(screen);
    draw.draw_term.cursor(true);
    draw.draw_term.moveto(x + 2, y + 2);
}

function resize() {
    screen.resize(draw.width(), draw.height());
    redraw();
}

function quit(code) {
    draw.close();
    process.exit(code);
}

draw.on('keypress', type);

draw.on('special', function (name, mods) {
    switch (name) {
    case 'left':
        moveX(-1);
        break;
    case 'right':
        moveX(+1);
        break;
    case 'up':
        moveY(-1);
        break;
    case 'down':
        moveY(+1);
        break;
    default:
        break;
    }
});

draw.on('control', function (info) {
    switch (info.key) {
    case '^C':
        quit(0);
    case '^A':
        offset.x = 0;
        break;
    case '^E':
        offset.x = lines[offset.y].length;
        break;
    case '^H':
        backspace();
        break;
    case '^J':
    case '^M':
        newline();
        break;
    default:
        break;
    }
});

draw.on('resize', resize);
resize();

setInterval(function () {
    drawBox();
    redraw();
}, 100);

