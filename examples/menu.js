var mod_draw = require('../');

var draw = new mod_draw.Draw({});

var main = {
    title: "Main Menu",
    submenus: [
        {
            title: "Example 1",
            submenus: [
                { title: "Do thing for ex 1" },
                { title: "Do another thing for ex 1" },
                { title: "Wow, a third thing for ex 1!" }
            ]
        },
        {
            title: "Example 2",
            submenus: [
                { title: "Hello there!" },
                { title: "These are Example 2 things" },
                { title: "So cool!" }
            ]
        },
        {
            title: "Example 3",
            submenus: [
                { title: "go run mls!" },
                { title: "now go run mjob!" },
                { title: "you're a manta pro!" }
            ]
        }
    ]
};

var curr = null;
var idx = 0;

// --- Basic UI elements and logic

var screen, mbox;

var top = new mod_draw.Region({});
top.on('resize', function () {
    top.str(0, 0, "[F1 Main Menu] [F2 Exit]", { bold: true });
});

var bottom = new mod_draw.Region({});
bottom.on('resize', function () {
    bottom.clear();
});

function warn(s) {
    bottom.clear();
    bottom.str(0, 0, s, { bold: true });
    draw.redraw(screen);
}

function redraw() {
    screen._redo();
    draw.redraw(screen);
}

function resize() {
    screen.resize(draw.width(), draw.height());
    redraw();
}

function quit(code) {
    draw.close();
    process.exit(code);
}

draw.on('resize', resize);

// --- Menu UI logic

function redrawMenu() {
    menu.clear();

    for (var i = 0; i < curr.submenus.length; i++) {
        menu.str(0, i, curr.submenus[i].title, { inverse: (i === idx) });
    }

    draw.redraw(screen);
}

function selectMenu(m) {
    if (!Array.isArray(m.submenus) || m.submenus.length === 0) {
        warn('No submenus for \"' + m.title + '\"');
        return;
    }

    curr = m;
    idx = 0;

    mbox = new mod_draw.controls.Box({ title: curr.title });
    screen = new mod_draw.controls.Layout({
        height: draw.height(),
        width: draw.width()
    });

    mbox.add(menu);
    screen.add(top, { fixed_height: 1 });
    screen.add(mbox, { weight: 1 });
    screen.add(bottom, { fixed_height: 1 });

    screen._redo();

    redrawMenu();
}

function selectIdx(next) {
    if (next < 0) {
        next = curr.submenus.length - 1;
    } else if (next >= curr.submenus.length) {
        next = 0;
    }

    idx = next;

    redrawMenu();
}

var menu = new mod_draw.Region({});
menu.on('resize', redrawMenu);

// Initialize the menu.
selectMenu(main);
resize();

// --- Keyboard Events

draw.on('special', function (name, mods) {
    switch (name) {
    case 'F1':
        selectMenu(main);
        break;
    case 'F2':
        quit(0);
        break;
    case 'up':
        selectIdx(idx - 1);
        break;
    case 'down':
        selectIdx(idx + 1);
        break;
    default:
        warn('No action for ' + name);
        break;
    }
});

draw.on('keypress', function (k) {
    warn('User typed: ' + JSON.stringify(k));
});

draw.on('control', function (info) {
    switch (info.key) {
    case '^C':
        quit(0);
    case '^J':
    case '^M':
        selectMenu(curr.submenus[idx]);
        break;
    default:
        warn('No action for ' + info.key);
        break;
    }
});
