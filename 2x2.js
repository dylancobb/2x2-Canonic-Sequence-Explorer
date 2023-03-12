let count = 0;
let pat = [];

// generate first melodic interval
for (let i = -7; i <= 7; ++i) {
    // exclude dissonant leaps
    if (Math.abs(i) === 6)
        continue;
    // generate second melodic interval
    for (let j = -7; j <= i; ++j) {
        // exclude dissonant leaps
        if ((Math.abs(j) === 6)
            // exclude "unrecovered" leaps larger than a 3rd
            || ((Math.abs(i) > 2 || Math.abs(j) > 2) && i * j > 0))
            continue;
        // pass melodic model to consonances() to complete pattern
        consonances(i, j);
    }
}

// find valid consonances to accompany melodic models
function consonances(i, j) {
    // generate first vertical interval
    for (let k = 0; k < (i - j + 7); ++k) {
        // second vertical interval is algebraically inferred
        let n = k + j - i;
        // first vertical int may not be dissonant
        if ((k % 7 === 1 || k % 7 === 6)
            // second vertical int may not be dissonant
            || (Math.abs(n) % 7 === 1 || Math.abs(n) % 7 === 6)
            // absolute magnitude of second vertical int should be less than 7
            // except for the unique combination of 7 and -7 for the two ints
            || (Math.abs(n) >= 7 && (k !== 7 || n !== -7))
            // exclude perfect consonances approached by parallel motion
            || (i !== 0 && i === j && (k === 0 || k === 4))
            // exclude contrary motion between perfects and their compounds
            || (i - 7 === j && (k === 7 || k === 11))
            // if first int is unison, second should not be negative
            || (k === 0 && n < 0)
            // exclude redundant duplicate patterns containing voice-crossing
            || (k < Math.abs(n)))
            continue;

        // store entrance intervals
        const entry_a = i + n;
        const entry_b = i - k;

        // assemble pattern data
        pat.push({
            // pattern intervals
            val: [i, j, k, n],
            // index of elaboration
            jv: get_jv(k, n),
            // entance intervals
            entry: [entry_a, entry_b],
            // note swap (will equal "false" if not viable)
            nswap: n === 0 ? false
                : model_check(entry_a, entry_b) ? [entry_a, entry_b, k, -n]
                    : false,
            // 8ve swap (will equal "false" if not viable)
            oswap: oswap_gen([i, j, k, n])
        });

        // const para = document.createElement("p");
        // para.className = 'pattern'
        // let node = document.createTextNode(hexcode(pat[count].val));
        // ++count;
        // para.appendChild(node);

        // const element = document.getElementById("pattern-list");
        // element.appendChild(para);
    }
}

for (let i = 0; i < 256; i++) {
    const para = document.createElement("p");
    para.className = 'pattern';
    para.id = "pattern" + i;
    para.onclick = function () {
        // Show pattern name
        const patName = document.getElementById('pattern-name');
        patName.innerHTML = hexcode(pat[i].val);
        // Show pattern Jv
        const jv = document.getElementById('jv');
        switch (pat[i].jv) {
            case 0: case -3: case -4: case -7: case -10: case -11:
                jv.innerHTML = "<sup>1</sup><em>Jv</em> = " + pat[i].jv;
                break;
            default:
                jv.innerHTML = "<sup>2</sup><em>Jv</em> = " + pat[i].jv;
                break;
        }
        // Show pattern entry intervals
        const entries = document.getElementById('entry');
        const firstEntry = pat[i].entry[0] > 0 ? "↗" + pat[i].entry[0] :
        pat[i].entry[0] < 0 ? "↘" + Math.abs(pat[i].entry[0]) : "→0";
        const secondEntry = pat[i].entry[1] > 0 ? "↗" + pat[i].entry[1] :
        pat[i].entry[1] < 0 ? "↘" + Math.abs(pat[i].entry[1]) : "→0";
        entries.innerHTML = firstEntry + ", " + secondEntry;
        // Show pattern alias
        const alias = document.getElementById('alias');
        alias.innerHTML = same_check(pat[i].val, getAlias(pat[i].val)) ? "N/A" :
        hexcode(getAlias(pat[i].val));
        // Show pattern retrograde
        const retro = document.getElementById('retro');
        same_check(pat[i].val, getRetro(pat[i].val)) ? retro.innerHTML = "N/A" :
        retro.innerHTML = hexcode(getRetro(pat[i].val));
    };

    let node = document.createTextNode(hexcode(pat[i].val));
    para.appendChild(node);

    const element = document.getElementById("pattern-list");
    element.appendChild(para);
}

// set up array to track JJv filtering
let jvFlag = new Array(14);
for (let i = 0; i <= 13; i++) {
    jvFlag[i] = true;
}

// toggle the state of given Jv filters
function jvToggle(x) {
    jvFlag[x] = !jvFlag[x];
    applyJv();
    jvButtonUpdate();
}

// hides/shows patterns based on JJv flags
function applyJv() {
    for (let i = 0; i < 256; i++) {
        let thisPat = document.getElementById("pattern" + i);
        if(filterJv(i)) {
            thisPat.style.display = "block";
        } else {
            thisPat.style.display = "none";
        }
    }
}

function jvButtonUpdate() {
    for (let i = 0; i <= 13; i++) {
        buttonCol = document.getElementById("jv-" + i)
        if (jvFlag[i]) {
            buttonCol.style.backgroundColor = "#BB2F3D";
            buttonCol.style.color = "white";
        } else {
            buttonCol.style.backgroundColor = "#ccc";
            buttonCol.style.color = "black";
        }
    }
}

// returns true if a given pattern matches the currently toggled JJv, else false
function filterJv(x) {
    for (let i = 0; i <= 13; i++) {
        if(pat[x].jv === 0 - i && jvFlag[i])
            return true;
    }
    return false;
}

// set all Jv toggles to off
function jvNone() {
    for (let i = 0; i <= 13; i++) {
        jvFlag[i] = false;
    }
    applyJv();
    jvButtonUpdate();
}

// set all Jv toggles to on
function jvAll() {
    for (let i = 0; i <= 13; i++) {
        jvFlag[i] = true;
    }
    applyJv();
    jvButtonUpdate();
}

// turns pattern array into formatted hexcode string
function hexcode(val) {
    if (val === false)
        return false;
    let code = "";

    // first melodic int
    val[0] > 0 ? code += 'U' + Math.abs(val[0])
        : val[0] < 0 ? code += 'D' + Math.abs(val[0])
            : code += 'S';
    // second melodic int
    val[1] > 0 ? code += 'U' + Math.abs(val[1])
        : val[1] < 0 ? code += 'D' + Math.abs(val[1])
            : code += 'S';
    // first and second vertical ints
    code += ':' + val[2] + ',' + val[3];

    return code;
}

// swaps to the opposite permutation of a pattern
function alias(a) {
    [a[1], a[0], a[3], a[2]] = [a[0], a[1], a[2], a[3]];
}

// returns the opposite permutation of a pattern
function getAlias(a) {
    return [a[1], a[0], a[3], a[2]];
}

// returns a patterns' retrograde
function getRetro(a) {
    return [-a[1], -a[0], a[2], a[3]];
}

// calculates the index a pattern elaborates at
function get_jv(x, y) {
    let jv = -x - y;
    while (jv < -13)
        jv += 7;
    return jv;
}

// returns true for valid melodic models, else false
function model_check(a, b) {
    // no leaps larger than an 8ve
    if (Math.abs(a) > 7 || Math.abs(b) > 7)
        return false;
    // no dissonant leaps
    if (Math.abs(a) === 6 || Math.abs(b) === 6)
        return false;
    // no un-recovered leaps larger than a 3rd
    if ((Math.abs(a) > 2 || Math.abs(b) > 2) && a * b > 0)
        return false;
    return true;
}

// returns true if two patterns are the same, else false
function same_check(a, b) {
    for (let i = 0; i < 3; i++)
        if (a[i] !== b[i])
            return false;
    return true;
}

// returns 8ve-swapped version of pattern if valid, or false if invalid
function oswap_gen(a) {
    // octave swap pattern, then clean
    const swap = [a[1] + 7, a[0] - 7, a[3] + 7, a[2] - 7];
    clean_oswap(swap);

    // if oswapped pattern is invalid or redundant, try salvaging
    if (model_check(swap[0], swap[1]) === false
        || same_check(swap, a) === true)
        salvage_swap(swap);

    // make sure pattern is in normal order
    if (swap[0] < swap[1])
        alias(swap);

    // make sure oswapped pattern is valid and non-redundant again
    if (model_check(swap[0], swap[1]) === false
        || same_check(swap, a) === true)
        return false;

    return swap;
}

// make sure vertical ints in an 8ve-swapped pattern have a sensible range
function clean_oswap(a) {
    // if both consonances are compound ints, reduce until at least one isn't
    while (a[2] >= 7 && a[3] >= 7) {
        a[2] -= 7;
        a[3] -= 7;
    }
    // if both consonances are negative, increase until at least one isn't
    while (a[2] < 0 && a[3] < 0) {
        a[2] += 7;
        a[3] += 7;
    }
}

// try to salvage an octave swapped pattern that failed its first check
function salvage_swap(a) {
    // a small, b big, flip b and recalculate consonances and clean up
    if (Math.abs(a[0]) < 3) {
        a[1] = invertu(a[1]);
        // recalculate consonances
        a[3] = a[2] + a[1] - a[0];
        clean_oswap(a);
    }
    // b small, a big, flip a and recalculate consonances and clean up
    if (Math.abs(a[1]) < 3) {
        a[0] = invertu(a[0]);
        // recalculate consonances
        a[3] = a[2] + a[1] - a[0];
        clean_oswap(a);
    }
    // if a is larger than 7, reduce, recalculate consonances and clean
    if (Math.abs(a[0]) > 7) {
        a[0] %= 7;
        // recalculate consonances
        a[3] = a[2] + a[1] - a[0];
        clean_oswap(a);
    }
    // if b is larger than 7, reduce, recalculate consonances and clean
    if (Math.abs(a[1]) > 7) {
        a[1] %= 7;
        // recalculate consonances
        a[3] = a[2] + a[1] - a[0];
        clean_oswap(a);
    }
}

// inverts an interval at the octave, preserves unisons
function invertu(n) {
    n %= 7;
    if (n > 0)
        n -= 7;
    else if (n < 0)
        n += 7;
    return n;
}