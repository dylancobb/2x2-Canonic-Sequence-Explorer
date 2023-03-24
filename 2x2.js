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
                // model is melodically sound
                : model_check(entry_a, entry_b)
                // pattern is parallel-free
                && !(entry_a !== 0 && entry_a === entry_b
                && (k === 0 || k === 4))
                ? [entry_a, entry_b, k, -n] : false,
            // 8ve swap (will equal "false" if not viable)
            oswap: oswap_gen([i, j, k, n]),
            seqs: getseqs([i, j, k, n])
        });
        
        count++;
    }
    countPrint();
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
    || same_check(swap, a) === true
    // no counterparallels
    || (swap[2] === 11 & swap[3] === 4)
    // no parallels
    || (swap[0] !== 0 && swap[0] === swap[1]
    && (swap[2] === 0 || swap[2] === 4))) {
        // fringe case: another pattern may lead to this one via oswap. Backlink.
        for (let i = 0; i < pat.length; i++) {
            if (same_check(pat[i].oswap, a)) {
                swap[0] = pat[i].val[0];
                swap[1] = pat[i].val[1];
                swap[2] = pat[i].val[2];
                swap[3] = pat[i].val[3];
                
                return swap;
            }
        }
        return false;
    }

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

// find all possible root sequences a given pattern can support
function getseqs(pat) {
	// >>> MECHANISM TO COMPUTE SUPPORTED ROOT MOTIONS <<<
	// storage for possible root positions WRT lower note of each consonance
	const possroot = [
    	[ 0, -2, -4 ],
        [ ],
    	[ 0, -2 ],
    	[ -4 ],
    	[ 0 ],
    	[ -2, -4 ]
    ];

	// first and second half of root pattern
	let a, b;
	// first and second consonance from input pattern
	let x = pat[2];
	let y = pat[3];
    // for storing seqs temporarily
    let seqs = [];

	// reduce consonances to simple positive ints
	while (x < 0)
		x += 7;
	x %= 7;
	while (y < 0)
		y += 7;
	y %= 7;

	// work out all possible root sequences
	for (let i = 0; i < possroot[x].length; i++) {
		for (let j = 0; j < possroot[y].length; j++) {
			// set values for first and second half of root sequence
			a = pat[0] + possroot[y][j] - possroot[x][i];
			b = pat[0] + pat[1] - a;
			// process intervals
			[a, b] = cleanseq(a, b);

            // check if sequence is already listed
            let dupe = false;
            for (let k = seqs.length; k > 0; k -= 2) {
                if ((k >= 2 && a === seqs[k-2] && b === seqs[k-1])) {
                    dupe = true;
                    break;
                }
            }
            // sequence is unique: save intervals
            if (!dupe) {
                seqs.push(a);
                seqs.push(b);
            }
		}
	}
	// sort sequences if not correctly ordered
	sortseqs(seqs);

    switch (seqs.length) {
        case 2:
            return [[seqs[0], seqs[1]]];
        case 4:
            return [[seqs[0], seqs[1]], [seqs[2], seqs[3]]];
        case 6:
            return [[seqs[0], seqs[1]], [seqs[2], seqs[3]], [seqs[4], seqs[5]]];
    }
}

// clean up the intervals in generated root sequence models
function cleanseq(a, b) {
	// make sure a and b are simple ints
	a %= 7;
	b %= 7;
	// algo to arrange output in normal order
	if (Math.abs(a) + Math.abs(b) >= 7) {
		// invert larger int at the 8ve
		if (Math.abs(a) > Math.abs(b)) {
			a = invert(a);
		} else {
			b = invert(b);
		}
	}
	// if both ints have same sign and combined magnitude > 4, flip the smaller
	if ((a) * (b) > 0 &&
		Math.abs(a) + Math.abs(b) > 4) {
		// invert first int at the 8ve
		if (Math.abs(a) > Math.abs(b))
			a = invert(a);
		// invert second int at the 8ve
		else
			b = invert(b);
	}
	// if either int is zero, the other should not exceed 3
	if ((a === 0 || b === 0) &&
		(Math.abs(a) > 3 || Math.abs(b) > 3)) {
		// invert first int at the 8ve
		if (a !== 0)
			a = invert(a);
		// invert second int at the 8ve
		else
			b = invert(b);
	}
	// if either int is larger than 2 and signs the same, flip larger
	if ((Math.abs(a) > 2 || Math.abs(b) > 2) &&
		((a) * (b) > 0)) {
		if (Math.abs(a) > Math.abs(b))
			a = invert(a);
		else
			b = invert(b);
	}
	// no int should be larger than 4 in magnitude
	if (Math.abs(a) > 4)
		a = invert(a);
	if (Math.abs(b) > 4)
		b = invert(b);
	// make sure it's in normal order (again)
	if (a < b) {
		let swap = a;
		a = b;
		b = swap;
	}
    return [a, b];
}

// inverts an interval at the octave, unisons become -7
function invert(n) {
	n %= 7;
	if (n >= 0)
		n -= 7;
	else
		n += 7;
    return n;
}

// bubble sorts sequences stored in array string
function sortseqs(a) {
    let count = a.length;
	let swap;
	
	// check if int 1 of each seq is larger than the seq before, swaps if true
	for (let i = count - 2; i >= 2; i -= 2) {
		if (a[i] > a[i-2]) {
			swap = a[i];
			a[i] = a[i-2];
			a[i-2] = swap;
			swap = a[i+1];
			a[i+1] = a[i-1];
			a[i-1] = swap;
		}
	}
	// checks if the patterns are sorted, repeats process if not
	for (let i = count - 2; i >= 2; i -= 2)
		if (a[i] > a[i-2])
			sortseqs(a, 4, count);	
}

// convert s[].seqs[] short array to char string
function stringseqs(a) {
	let str = "";

    // FIRST INT CASES
    // first int is greater than zero
    if (a[0] > 0) {
        str = "U";
        str += a[0];
    // first int is negative
    } else if (a[0] < 0) {
        str = "D";
        str += Math.abs(a[0]);
    // first int is zero
    } else {
        str = "S";
    }
    // SECOND INT CASES
    // second int is greater than zero
    if (a[1] > 0)
    {
        str += "U";
        str += a[1];
    // second int is less than zero
    } else if (a[1] < 0) {
        str += "D";
        str += Math.abs(a[1]);
    // second int is zero
    } else {
        str += "S";
    }

    // FLAG EXTREMELY UBIQUITOUS SEQUENCES
    // ascending fauxbourdon
    if ((a[0] === 1 && a[1] === 1)
    // descending fauxbourdon
    || (a[0] === -1 && a[1] === -1)
    // descending 5ths
    || (a[0] === 3 && a[1] === -4)
    // ascending 5ths
    || (a[0] === 4 && a[1] === -3)
    // ascending 5-6 / Monte
    || (a[0] === 3 && a[1] === -2)
    // descending 5-6 / Romanesca
    || (a[0] === 1 && a[1] === -3)
    // Antiromanesca
    || (a[0] === 3 && a[1] === -1)
    // descending 3rds
    || (a[0] === -2 && a[1] === -2)
    // descending 5ths + stationary
    || (a[0] === 3 && a[1] === 0)
    // ascending 5ths + stationary
    || (a[0] === 0 && a[1] === -3)
    // descending 3rds w/ interpolated Vs
    || (a[0] === 2 && a[1] === -4)
    // descending 3rds + stationary
    || (a[0] === 0 && a[1] === -2))
    str += "★";

	return str;
}

// prints the current number of unfiltered patterns
function countPrint() {
    document.getElementById('counter').innerHTML = count + " ";
}

let jvFilterBox = document.getElementById("jv-filter");
let entryFilterBox = document.getElementById("entry-filter");
let modelFilterBox = document.getElementById("model-filter");
let vpFilterBox = document.getElementById("vp-filter");
let seqFilterBox = document.getElementById("seq-filter");
// make the input boxes function via the enter key as well as the mouse
document.getElementById('first-seq-box').addEventListener(
    "keyup",
    (event) => {
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }
        if (event.key === "Enter") {
            document.getElementById('second-seq-box').focus();
        } else {
            return; // Quit when this doesn't handle the key event.
        }
        // Cancel the default action to avoid it being handled twice
        event.preventDefault();
        },
        true
);
document.getElementById('second-seq-box').addEventListener(
    "keyup",
    (event) => {
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }
        if (event.key === "Enter") {
            document.getElementById('seq-add').click();
        } else {
            return; // Quit when this doesn't handle the key event.
        }
        // Cancel the default action to avoid it being handled twice
        event.preventDefault();
        },
        true
);

// set up arrays to track filters
let jvFlag = new Array(14);
let entryFlag = new Array(25);
let modelFlag = new Array(15);
let modelIncFlag = true;
let modelIncButton = document.getElementById("model-inc");
let modelExButton = document.getElementById("model-ex");
let vpFlag = 0; // 0 = agnostic, 1 = all, 2 = not OVP, 3 = UVP only
let seqFlag = new Array();

showJv();
resetFlags();
modelIncButtonUpdate();
vpButtonUpdate();

// populate the pattern column
for (let i = 0; i < 256; i++) {
    const para = document.createElement("p");
    para.className = 'pattern';
    para.id = "pattern" + i;
    para.onclick = function () {
        patternData(i);
    };

    let node = document.createTextNode(hexcode(pat[i].val));
    para.appendChild(node);

    const element = document.getElementById("pattern-list");
    element.appendChild(para);
}

// populates pattern data block with specified pattern's data
function patternData(i) {
    // show score snippet
    showScore(i);
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
    retro.innerHTML = `<span class="pattern-link" onclick="retroGoto(${i})">${hexcode(getRetro(pat[i].val))}</span>`;
    // Show pattern note swap
    const nswap = document.getElementById('nswap');
    nswap.innerHTML = pat[i].nswap ? `<span class="pattern-link" onclick="nswapGoto(${i})">${hexcode(pat[i].nswap)}</span>` : "N/A";
    // Show pattern octave swap
    const oswap = document.getElementById('oswap');
    oswap.innerHTML = pat[i].oswap ? `<span class="pattern-link" onclick="oswapGoto(${i})">${hexcode(pat[i].oswap)}</span>` : "N/A";
    // Show root sequences
    const seqs = document.getElementById('seqs');
    switch (pat[i].seqs.length) {
        case 1:
            seqs.innerHTML = `<span class="pattern-link" onclick="pushSeq(${pat[i].seqs[0][0]},${pat[i].seqs[0][1]});showSeq();">${stringseqs(pat[i].seqs[0])}</span>`;
            break;
        case 2:
            seqs.innerHTML = `<span class="pattern-link" onclick="pushSeq(${pat[i].seqs[0][0]},${pat[i].seqs[0][1]});showSeq();">${stringseqs(pat[i].seqs[0])}</span>`
            + "or" + `<span class="pattern-link" onclick="pushSeq(${pat[i].seqs[1][0]},${pat[i].seqs[1][1]});showSeq();">${stringseqs(pat[i].seqs[1])}</span>`;
            break;
        case 3:
            seqs.innerHTML = `<span class="pattern-link" onclick="pushSeq(${pat[i].seqs[0][0]},${pat[i].seqs[0][1]});showSeq();">${stringseqs(pat[i].seqs[0])}</span>`
            + `<span class="pattern-link" onclick="pushSeq(${pat[i].seqs[1][0]},${pat[i].seqs[1][1]});showSeq();">${stringseqs(pat[i].seqs[1])}</span>`
            + "or" + `<span class="pattern-link" onclick="pushSeq(${pat[i].seqs[2][0]},${pat[i].seqs[2][1]});showSeq();">${stringseqs(pat[i].seqs[2])}</span>`
            break;
    };
    // add warning boxes to patterns that need them
    const warningBox = document.getElementById('warning-container');
    if (Math.abs(pat[i].val[2] % 7) === 3 || Math.abs(pat[i].val[3] % 7) === 3) {
        warningBox.innerHTML = '<p id="param-warning">This pattern is only suitable for deployment in upper voice pairs.</p>';
    } else if ((pat[i].val[0] * pat[i].val[1] > 0
        && (Math.abs(pat[i].val[2] % 7) === 0 || Math.abs(pat[i].val[2] % 7) === 4
        || Math.abs(pat[i].val[3] % 7) === 0 || Math.abs(pat[i].val[3] % 7) === 4))
        || ((Math.abs(pat[i].val[2] % 7) === 0 || Math.abs(pat[i].val[2] % 7) === 4)
        && (Math.abs(pat[i].val[3] % 7) === 0 || Math.abs(pat[i].val[3] % 7) === 4))
        && i !== 33 && i !== 36 && i !== 151 && i !== 213) {
            warningBox.innerHTML = '<p id="param-warning">This pattern may be unsuitable for deployment in the outer voice pair.</p>';
    } else {
        warningBox.innerHTML = '';
    }
    const playButton = document.getElementById("play-container");
    playButton.innerHTML =`<p id="play-button" onclick="playPattern()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
            <path
                d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z">
            </path>
        </svg>
    </p>`;
    // Update the URL to reflect the currently displayed pattern
    const newUrl = window.location.origin + window.location.pathname + '?pattern=' + i;
    window.history.replaceState({}, '', newUrl);
}

// takes a pattern array and finds its index (linear search)
function findPattern(A) {
    for (let i = 0; i <= 256; i++) {
        if (pat[i].val[0] === A[0] && pat[i].val[1] === A[1]
        && pat[i].val[2] === A[2] && pat[i].val[3] === A[3])
        return i;
    }
    return false;
}

// takes a pattern index, finds its retro and goes there
function retroGoto(x) {
    patternData(findPattern(getRetro(pat[x].val)));
}

// takes a pattern index, finds its nswap and goes there
function nswapGoto(x) {
    patternData(findPattern(pat[x].nswap));
}

// takes a pattern index, finds its oswap and goes there
function oswapGoto(x) {
    patternData(findPattern(pat[x].oswap));
}

// hides all filter menus
function hideAll() {
    jvFilterBox.style.display = "none";
    entryFilterBox.style.display = "none";
    modelFilterBox.style.display = "none";
    vpFilterBox.style.display = "none";
    seqFilterBox.style.display = "none";
}

// sets all filter buttons to their unselected colour
function resetFilterButtons() {
    document.getElementById("jv-toggle").style.backgroundColor = "#ccc";
    document.getElementById("jv-toggle").style.color = "black";
    document.getElementById("entry-toggle").style.backgroundColor = "#ccc";
    document.getElementById("entry-toggle").style.color = "black";
    document.getElementById("model-toggle").style.backgroundColor = "#ccc";
    document.getElementById("model-toggle").style.color = "black";
    document.getElementById("vp-toggle").style.backgroundColor = "#ccc";
    document.getElementById("vp-toggle").style.color = "black";
    document.getElementById("seq-toggle").style.backgroundColor = "#ccc";
    document.getElementById("seq-toggle").style.color = "black";
}

// open the Jv filter menu, close the rest
function showJv() {
    hideAll();
    jvFilterBox.style.display = "block";
    resetFilterButtons();
    document.getElementById("jv-toggle").style.backgroundColor = "#BB2F3D";
    document.getElementById("jv-toggle").style.color = "white";
}

// open the Entry filter menu, close the rest
function showEntry() {
    hideAll();
    entryFilterBox.style.display = "block";
    resetFilterButtons();
    document.getElementById("entry-toggle").style.backgroundColor = "#BB2F3D";
    document.getElementById("entry-toggle").style.color = "white";
}

// open the Model filter menu, close the rest
function showModel() {
    hideAll();
    modelFilterBox.style.display = "block";
    resetFilterButtons();
    document.getElementById("model-toggle").style.backgroundColor = "#BB2F3D";
    document.getElementById("model-toggle").style.color = "white";
}

// open the VP filter menu, close the rest
function showVP() {
    hideAll();
    vpFilterBox.style.display = "block";
    resetFilterButtons();
    document.getElementById("vp-toggle").style.backgroundColor = "#BB2F3D";
    document.getElementById("vp-toggle").style.color = "white";
}

// open the Seqs filter menu, close the rest
function showSeq() {
    hideAll();
    seqFilterBox.style.display = "block";
    resetFilterButtons();
    document.getElementById("seq-toggle").style.backgroundColor = "#BB2F3D";
    document.getElementById("seq-toggle").style.color = "white";
}

// reset all filter flags
function resetFlags() {
    for (let i = 0; i <= 13; i++) {
        jvFlag[i] = true;
    }
    for (let i = 0; i < 25; i++) {
        entryFlag[i] = true;
    }
    for (let i = 0; i < 15; i++) {
        modelFlag[i] = true;
    }
    vpFlag = 0;
    seqFlag = [];
    clearSeqBubbles();
}

function clearSeqBubbles() {
    const elements = document.getElementsByClassName("seq-bubble");
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
}

// toggle the state of given Jv filters
function jvToggle(x) {
    jvFlag[x] = !jvFlag[x];
    applyFilters();
    jvButtonUpdate();
}

// toggle the state of given entry filters
function entryToggle(x) {
    entryFlag[x + 12] = !entryFlag[x + 12];
    applyFilters();
    entryButtonUpdate();
}

// toggle the state of given model filters
function modelToggle(x) {
    modelFlag[x + 7] = !modelFlag[x + 7];
    applyFilters();
    modelButtonUpdate();
}

function modelInc() {
    modelIncFlag = true;
    applyFilters();
    modelIncButtonUpdate();
}

function modelEx() {
    modelIncFlag = false;
    applyFilters();
    modelIncButtonUpdate();
}

// toggle the state of given voice pair filters
function vpAgnostic() {
    vpFlag = 0;
    applyFilters();
    vpButtonUpdate();
}

function vpAll() {
    vpFlag = 1;
    applyFilters();
    vpButtonUpdate();
}

function vpNotOuter() {
    vpFlag = 2;
    applyFilters();
    vpButtonUpdate();
}

function vpUpper() {
    vpFlag = 3;
    applyFilters();
    vpButtonUpdate();
}

// updates the model inc/ex button colours
function modelIncButtonUpdate() {
    if (modelIncFlag === true) {
        modelIncButton.style.backgroundColor = "#BB2F3D";
        modelIncButton.style.color = "white";
        modelExButton.style.backgroundColor = "#ccc";
        modelExButton.style.color = "black";
    } else {
        modelIncButton.style.backgroundColor = "#ccc";
        modelIncButton.style.color = "black";
        modelExButton.style.backgroundColor = "#BB2F3D";
        modelExButton.style.color = "white";
    }
}

// takes user input and adds a sequence to the filter list
function addSeq() {
    // take user input, clear input, re-focus first input box for next entry
    let a = document.getElementById('first-seq-box').value;
    document.getElementById('first-seq-box').value = "";
    let b = document.getElementById('second-seq-box').value;
    document.getElementById('second-seq-box').value = "";
    document.getElementById('first-seq-box').focus();
    // prepare sequence from user input
    [a, b] = cleanseq(a, b);
    
    pushSeq(a, b);
}

// adds a sequence to the filter list, creates bubble, applies filters
function pushSeq(a, b) {
    const tag = stringseqs([a, b]);
    if (!document.getElementById(tag)) {
        createSeqBubble(tag, a, b);
        seqFlag.push([a, b]);
        applyFilters();
    }
}

// add all the starred sequences
function addStars() {
    pushSeq(1, 1);
    pushSeq(-1, -1);
    pushSeq(3, -4);
    pushSeq(4, -3);
    pushSeq(3, -2);
    pushSeq(1, -3);
    pushSeq(3, -1);
    pushSeq(-2, -2);
    pushSeq(3, 0);
    pushSeq(0, -3);
    pushSeq(2, -4);
    pushSeq(0, -2);
}

// clear the added sequence list and refresh filters
function clearSeqs() {
    seqFlag = [];
    clearSeqBubbles();
    applyFilters();
}

// creates a new sequence bubble in the filter list
function createSeqBubble(tag, a, b) {
    const newSeq = document.createElement("p");
    newSeq.className = 'seq-bubble';
    newSeq.id = tag;
    newSeq.onclick = function () {
        // delete bubble
        document.getElementById(tag).remove();
        // find the index of seqFlag that contains this sequence
        for (let i = 0; i < seqFlag.length; i++) {
            if (seqFlag[i][0] === a && seqFlag[i][1] === b)
                // remove pattern from seqFlag
                seqFlag.splice(i, 1);
        }
        applyFilters();
    };

    let node = document.createTextNode(tag);
    newSeq.appendChild(node);

    const element = document.getElementById("seq-list");
    element.appendChild(newSeq);
}

// hides/shows patterns based on all flags
function applyFilters() {
    count = 0;
    for (let i = 0; i < 256; i++) {
        let thisPat = document.getElementById("pattern" + i);
        if(filterJv(i) && filterEntry(i) && modelEntry(i) && filterVP(i) && filterSeq(i)) {
            thisPat.style.display = "block";
            count++;
        } else {
            thisPat.style.display = "none";
        }
    }
    countPrint();
}

// reset filters
function filterReset() {
    resetFlags();
    applyFilters();
    jvButtonUpdate();
    entryButtonUpdate();
    modelButtonUpdate();
    vpButtonUpdate();
}

// update the state of Jv button colours when toggling is changed
function jvButtonUpdate() {
    for (let i = 0; i <= 13; i++) {
        const buttonCol = document.getElementById("jv-" + i);
        if (jvFlag[i]) {
            buttonCol.style.backgroundColor = "#BB2F3D";
            buttonCol.style.color = "white";
        } else {
            buttonCol.style.backgroundColor = "#ccc";
            buttonCol.style.color = "black";
        }
    }
}

// update the state of entry button colours when toggling is changed
function entryButtonUpdate() {
    for (let i = -12; i <= 12; i++) {
        let buttonCol;
        if (i >= 0) {
            buttonCol = document.getElementById("entry-" + i);
        } else {
            buttonCol = document.getElementById("entry-m" + Math.abs(i));
        }
        if (entryFlag[i + 12]) {
            buttonCol.style.backgroundColor = "#BB2F3D";
            buttonCol.style.color = "white";
        } else {
            buttonCol.style.backgroundColor = "#ccc";
            buttonCol.style.color = "black";
        }
    }
}

// update the state of model button colours when toggling is changed
function modelButtonUpdate() {
    for (let i = -7; i <= 7; i++) {
        if (i === 6 || i === -6) {
            continue;
        }
        let buttonCol;
        if (i >= 0) {
            buttonCol = document.getElementById("model-" + i);
        } else {
            buttonCol = document.getElementById("model-m" + Math.abs(i));
        }
        if (modelFlag[i + 7]) {
            buttonCol.style.backgroundColor = "#BB2F3D";
            buttonCol.style.color = "white";
        } else {
            buttonCol.style.backgroundColor = "#ccc";
            buttonCol.style.color = "black";
        }
    }
}

// update the state of VP button colours when toggling is changed
function vpButtonUpdate() {
    const buttonColAgnostic = document.getElementById("vp-agnostic");
    const buttonColAll = document.getElementById("vp-all");
    const buttonColNotOuter = document.getElementById("vp-not-outer");
    const buttonColUpper = document.getElementById("vp-upper");
        if (vpFlag === 0) {
            buttonColAgnostic.style.backgroundColor = "#BB2F3D";
            buttonColAgnostic.style.color = "white";
        } else {
            buttonColAgnostic.style.backgroundColor = "#ccc";
            buttonColAgnostic.style.color = "black";
        }
        if (vpFlag === 1) {
            buttonColAll.style.backgroundColor = "#BB2F3D";
            buttonColAll.style.color = "white";
        } else {
            buttonColAll.style.backgroundColor = "#ccc";
            buttonColAll.style.color = "black";
        }
        if (vpFlag === 2) {
            buttonColNotOuter.style.backgroundColor = "#BB2F3D";
            buttonColNotOuter.style.color = "white";
        } else {
            buttonColNotOuter.style.backgroundColor = "#ccc";
            buttonColNotOuter.style.color = "black";
        }
        if (vpFlag === 3) {
            buttonColUpper.style.backgroundColor = "#BB2F3D";
            buttonColUpper.style.color = "white";
        } else {
            buttonColUpper.style.backgroundColor = "#ccc";
            buttonColUpper.style.color = "black";
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

// returns true if a given pattern matches the currently toggled entry int, else false
function filterEntry(x) {
    for (let i = -12; i <= 12; i++) {
        if((pat[x].entry[0] === i || pat[x].entry[1] === i) && entryFlag[i + 12])
            return true;
    }
    return false;
}

// returns true if a given pattern matches the currently toggled model, else false
function modelEntry(x) {
    let exCounter = 0;
    for (let i = -7; i <= 7; i++) {
        if(modelIncFlag === true) {
            if((pat[x].val[0] === i || pat[x].val[1] === i) && modelFlag[i + 7])
                return true;
        } else {
            if(pat[x].val[0] === i && modelFlag[i + 7])
                exCounter++;
            if(pat[x].val[1] === i && modelFlag[i + 7])
                exCounter++;
        }
    }
    if (exCounter > 1)
        return true;
    return false;
}

// returns true if a given pattern matches the currently toggled voice pair
// applicability, else false
function filterVP(x) {
    // agnostic doesn't care
    if (vpFlag === 0) {
        return true;
    // valid in the outer voice pair (no direct perfects, no fourths)
    } else if (vpFlag === 1) {
        if ((pat[x].val[0] * pat[x].val[1] > 0
            && (Math.abs(pat[x].val[2] % 7) === 0 || Math.abs(pat[x].val[2] % 7) === 4
            || Math.abs(pat[x].val[3] % 7) === 0 || Math.abs(pat[x].val[3] % 7) === 4))
            || (Math.abs(pat[x].val[2] % 7) === 3 || Math.abs(pat[x].val[3] % 7) === 3)
            || ((Math.abs(pat[x].val[2] % 7) === 0 || Math.abs(pat[x].val[2] % 7) === 4)
            && (Math.abs(pat[x].val[3] % 7) === 0 || Math.abs(pat[x].val[3] % 7) === 4))
            && x !== 33 && x !== 36 && x !== 151 && x !== 213)
                return false;
        return true;
    // valid anywhere except the outer voice pair (has directs or fourths
    // or all perfect consonances
    } else if (vpFlag === 2) {
        if ((pat[x].val[0] * pat[x].val[1] > 0
        && (Math.abs(pat[x].val[2] % 7) === 0 || Math.abs(pat[x].val[2] % 7) === 4
        || Math.abs(pat[x].val[3] % 7) === 0 || Math.abs(pat[x].val[3] % 7) === 4))
        || (Math.abs(pat[x].val[2] % 7) === 3 || Math.abs(pat[x].val[3] % 7) === 3)
        || ((Math.abs(pat[x].val[2] % 7) === 0 || Math.abs(pat[x].val[2] % 7) === 4)
        && (Math.abs(pat[x].val[3] % 7) === 0 || Math.abs(pat[x].val[3] % 7) === 4))
        && x !== 33 && x !== 36 && x !== 151 && x !== 213)
            return true;
    // upper voice pair only (has fourths)
    } else if (vpFlag === 3) {
        if (Math.abs(pat[x].val[2] % 7) === 3 || Math.abs(pat[x].val[3] % 7) === 3)
            return true;
    }
    return false;
}

// returns true if a given pattern matches the currently added sequences, else false
function filterSeq(x) {
    if (!seqFlag.length)
        return true;
    for (let i = 0; i < seqFlag.length; i++) {
        for (let j = 0; j < pat[x].seqs.length; j++) {
            if (seqFlag[i][0] === pat[x].seqs[j][0]
            && seqFlag[i][1] === pat[x].seqs[j][1])
                return true;
        }
    }
    return false;
}

// set all Jv toggles to off
function jvNone() {
    for (let i = 0; i <= 13; i++) {
        jvFlag[i] = false;
    }
    applyFilters();
    jvButtonUpdate();
}

// set all Jv toggles to on
function jvAll() {
    for (let i = 0; i <= 13; i++) {
        jvFlag[i] = true;
    }
    applyFilters();
    jvButtonUpdate();
}

// shows just the 1JJv
function jvFirstType() {
    jvNone();
    jvToggle(0);
    jvToggle(7);
    jvToggle(3);
    jvToggle(10);
    jvToggle(4);
    jvToggle(11);
}

// shows just the 2JJv
function jvSecondType() {
    jvNone();
    jvToggle(1);
    jvToggle(2);
    jvToggle(5);
    jvToggle(6);
    jvToggle(8);
    jvToggle(9);
    jvToggle(12);
    jvToggle(13);
}

// set all entry toggles to off
function entryNone() {
    for (let i = -12; i <= 12; i++) {
        entryFlag[i + 12] = false;
    }
    applyFilters();
    entryButtonUpdate();
}

// set all entry toggles to on
function entryAll() {
    for (let i = -12; i <= 12; i++) {
        entryFlag[i + 12] = true;
    }
    applyFilters();
    entryButtonUpdate();
}

// set all model toggles to off
function modelNone() {
    for (let i = -7; i <= 7; i++) {
        modelFlag[i + 7] = false;
    }
    applyFilters();
    modelButtonUpdate();
}

// set all entry toggles to on
function modelAll() {
    for (let i = -7; i <= 7; i++) {
        modelFlag[i + 7] = true;
    }
    applyFilters();
    modelButtonUpdate();
}

// goes to a random pattern from the currently filtered list
function patRandom() {
    let filterIndex = [];
    for (let i = 0; i < 256; i++) {
        if(filterJv(i) && filterEntry(i) && modelEntry(i) && filterVP(i) && filterSeq(i))
            filterIndex.push(i);
    }
    patternData(filterIndex[Math.floor(Math.random() * filterIndex.length)]);
}


//====================================================================================
//====================================================================================


// test arrays to render
let voiceOne = [[-4, 4], [-5, 4], [2, 4], [1, 4], [8, 4], [7, 4]];
let voiceTwo = [[-8, 4], [-1, 4], [-2, 4], [5, 4], [4, 4], [11, 4]];
let timeTotal = 2;
for (let i = 0; i < voiceOne.length; i++) {
    timeTotal += voiceOne[i][1];
}
// sets the scale of the output
const unitSize = 150;
const lineHeight = 0.24 * unitSize;
const staffThickness = unitSize / 65;
const hexRed = "#BB2F3D";
const hexBlue = "#3C5EC4";

// notation canvas dimensions
let c = document.getElementById("myCanvas");
myHeight = 6 * unitSize
c.height = myHeight;
myWidth = 6 * unitSize * 1.15;
c.width = myWidth;
let ctx = c.getContext("2d");

drawStaff(0, myWidth);

// animate the placement of notes
let intervId;
let myOffset;
let myAlpha;

function refreshScore() {
    myOffset = 4;
    myAlpha = 0.07;
    intervId = setInterval(placeNotes, 30);
}

// place the notes
function placeNotes() {
    ctx.clearRect(0, 0, myWidth, myHeight);
    drawStaff(0, myWidth);
    let oneX = [2];
    let twoX = [2];
    for (let i = 1; i < voiceOne.length; i++) {
        oneX.push(oneX[i - 1] + voiceOne[i - 1][1]);
        twoX.push(twoX[i - 1] + voiceTwo[i - 1][1]);
    }
    // add voice crossing offsets
    for (let i = 0; i < voiceOne.length; i++) {
        for (let j = 0; j < voiceOne.length; j++) {
            if (twoX[j] === oneX[i]) {
                if (voiceOne[i][0] < voiceTwo[j][0]) {
                    oneX[i] += 0.25;
                    twoX[j] -= 0.25;
                }
                break;
            }
        }
    }
    for (let i = 0; i < voiceOne.length; i++) {
        noteDown(twoX[i] / timeTotal, voiceTwo[i][0], hexBlue, myOffset, myAlpha);
        noteUp(oneX[i] / timeTotal, voiceOne[i][0], hexRed, myOffset, myAlpha);
    }

    if (myAlpha === 1) {
        clearInterval(intervId);
    }

    myOffset = myOffset * 2 / 3;
    let x = 1 - myAlpha;
    x = x * 2 / 3;
    myAlpha = 1 - x;

    if (myAlpha > 0.99) {
        myOffset = 0;
        myAlpha = 1;
    }
}

// draw staff lines between two x-coordinates
function drawStaff(startX, endX) {
    ctx.beginPath();
    ctx.strokeStyle = "black";
    for (let i = -(2 * lineHeight); i <= (2 * lineHeight); i += lineHeight) {
        ctx.moveTo(startX, myHeight / 2 + i);
        ctx.lineWidth = staffThickness;
        ctx.lineTo(endX, myHeight / 2 + i);
    }
    ctx.stroke();
}

// create a note with an upward stem
function noteUp(x, y, color, offset = 0, alpha = 1) {
    color += Math.round((alpha) * 255).toString(16).padStart(2);
    drawLedger(x, y, alpha);
    drawNote(x, y + offset, color);
    drawStemUp(x, y + offset, color);
}

// create a note with a downward stem
function noteDown(x, y, color, offset = 0, alpha = 1) {
    color += Math.round((alpha) * 255).toString(16).padStart(2, "0");
    drawLedger(x, y, alpha);
    drawNote(x, y - offset, color);
    drawStemDown(x, y - offset, color);
}

// draw a notehead at a given position, plus ledgers if necessary
function drawNote(x, y, color) {
    // Draw the ellipse
    let ellipseX = myWidth * x;
    let ellipseY = myHeight / 2 + (- y * lineHeight) / 2;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(ellipseX, ellipseY, 0.46 * lineHeight, 0.66 * lineHeight,
        Math.PI / 3, 0, 2 * Math.PI);
    ctx.ellipse(ellipseX, ellipseY, 0.2 * lineHeight, 0.60 * lineHeight,
        Math.PI / 3, 0, 2 * Math.PI);
    ctx.fill("evenodd");

    // prepare stroke for stem coloring
    ctx.strokeStyle = color;
    ctx.lineWidth = staffThickness * 2;
}

// draw ledger lines as appropriate
function drawLedger(x, y, alpha = 1) {
    ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.lineWidth = staffThickness * 2.5;
    ledgerX = myWidth * x;
    if (y > 5) {
        let baseLine = myHeight / 2 - 2 * lineHeight;
        let ledgers = (y - 4) / 2;
        for (let i = 1; i <= ledgers; i++) {
            let ledgerPos = baseLine - i * lineHeight;
            ctx.beginPath();
            ctx.moveTo(ledgerX - lineHeight, ledgerPos);
            ctx.lineTo(ledgerX + lineHeight, ledgerPos);
            ctx.stroke();
        }
    }
    if (y < -5) {
        let baseLine = myHeight / 2 + 2 * lineHeight;
        let ledgers = (-y - 4) / 2;
        for (let i = 1; i <= ledgers; i++) {
            let ledgerPos = baseLine + i * lineHeight;
            ctx.beginPath();
            ctx.moveTo(ledgerX - lineHeight, ledgerPos);
            ctx.lineTo(ledgerX + lineHeight, ledgerPos);
            ctx.stroke();
        }
    }
}

// draw an upward step to a given notehead
function drawStemUp(x, y, color) {
    // draw the stem
    let stemX = myWidth * x + 1.15 * lineHeight / 2;
    let stemStartY = myHeight / 2 - lineHeight / 5 - (y * lineHeight / 2);
    let stemEndY = myHeight / 2 - 3.5 * lineHeight - (y * lineHeight / 2);

    ctx.beginPath();
    ctx.moveTo(stemX, stemStartY);
    ctx.lineTo(stemX, stemEndY);
    ctx.stroke();
}

// draw a downward stem to a given notehead
function drawStemDown(x, y, color) {
    // draw the stem
    let stemX = myWidth * x - 1.15 * lineHeight / 2;
    let stemStartY = myHeight / 2 + lineHeight / 5 - (y * lineHeight / 2);
    let stemEndY = myHeight / 2 + 3.5 * lineHeight - (y * lineHeight / 2);

    ctx.beginPath();
    ctx.moveTo(stemX, stemStartY);
    ctx.lineTo(stemX, stemEndY);
    ctx.stroke();
}

// generate the first voice's melody (un-normalised)
function getVoiceOne(i) {
    let voiceOneArray = [pat[i].val[2]];
    voiceOneArray.push(voiceOneArray[0] + pat[i].val[1]);
    voiceOneArray.push(voiceOneArray[1] + pat[i].val[0]);
    voiceOneArray.push(voiceOneArray[2] + pat[i].val[1]);
    voiceOneArray.push(voiceOneArray[3] + pat[i].val[0]);
    voiceOneArray.push(voiceOneArray[4] + pat[i].val[1]);
    return voiceOneArray;
}

// generate the second voice's melody (un-normalised)
function getVoiceTwo(i) {
    let voiceTwoArray = [0];
    voiceTwoArray.push(voiceTwoArray[0] + pat[i].val[0]);
    voiceTwoArray.push(voiceTwoArray[1] + pat[i].val[1]);
    voiceTwoArray.push(voiceTwoArray[2] + pat[i].val[0]);
    voiceTwoArray.push(voiceTwoArray[3] + pat[i].val[1]);
    voiceTwoArray.push(voiceTwoArray[4] + pat[i].val[0]);
    return voiceTwoArray;
}

// normalise the two voices about the central line of the staff, then print
function showScore(x) {
    let unNormOne = getVoiceOne(x);
    let unNormTwo = getVoiceTwo(x);
    let high = unNormOne[0];
    let low = unNormOne[0];
    for (let i = 0; i < unNormOne.length; i++) {
        if (unNormOne[i] > high)
            high = unNormOne[i];
        if (unNormTwo[i] > high)
            high = unNormTwo[i];
        if (unNormOne[i] < low)
            low = unNormOne[i];
        if (unNormTwo[i] < low)
            low = unNormTwo[i];
    }
    let offset = Math.floor((high - low) / 2) - high;
    voiceOne = [];
    voiceTwo = [];
    for (let i = 0; i < unNormOne.length; i++) {
        voiceOne.push([unNormOne[i] + offset, 4]);
        voiceTwo.push([unNormTwo[i] + offset, 4]);
    }
    refreshScore();
}


//==================================================================================
//==================================================================================


let audioContext = new AudioContext();

function DiaToChromatic(x) {
    const scale = [-10, -8, -7, -5, -3, -1, 0, 2, 4, 5, 7, 9, 11];
    x -= 1;
    // get octaves
    let oct = x >= 0 ? Math.floor(x / 7) : Math.ceil(x / 7);
    // scale degree to semitones
    let dia = scale[x % 7 + 6];

    return (oct * 12) + dia;
}

function playPattern() {
    let timing = [0];
    for (let i = 1; i < voiceOne.length; i++) {
        timing.push(timing[i-1] + voiceOne[i-1][1]);
    }
    audioContext.close();
    audioContext = new AudioContext();
    for (let i = 0; i < voiceOne.length; i++) {
        play(timing[i] / 6, DiaToChromatic(voiceOne[i][0]), 0.66, 0.5, 1)
        play(timing[i] / 6, DiaToChromatic(voiceTwo[i][0]), 0.66, -0.5, 0)
    }
}

function stopPlaying() {
    audioContext.close();
}

function play(delay, pitch, duration, panVal, oscType) {
    let startTime = audioContext.currentTime + delay;
    let endTime = startTime + duration;
    let oscillator = audioContext.createOscillator();
    let vol = audioContext.createGain();
    let filter = audioContext.createBiquadFilter();
    let pan = audioContext.createStereoPanner();
    oscillator.connect(vol).connect(filter).connect(pan).connect(audioContext.destination);

    filter.type = 'lowpass';
    oscillator.type = oscType ? "sawtooth" : "triangle";
    vol.gain.value = 0.05;

    pan.pan.value = panVal;

    oscillator.frequency.value = 440 * Math.pow(2, (pitch + 3) / 12);

    // add audioContext.currentTime
    oscillator.start(audioContext.currentTime + delay);
    oscillator.stop(audioContext.currentTime + delay + duration);
    filter.frequency.setValueAtTime(oscType ? 1000 : 2000, audioContext.currentTime + delay);
    filter.frequency.linearRampToValueAtTime(oscType ? 500 : 750, audioContext.currentTime + delay + duration);
    vol.gain.setValueAtTime(0.06, audioContext.currentTime + delay);
    vol.gain.exponentialRampToValueAtTime(0.06, audioContext.currentTime + delay + duration);

}

// Get the pattern ID from the URL parameter
const urlParams = new URLSearchParams(window.location.search);
const patternId = urlParams.get('pattern');
// if a pattern URL parameter is found, load that parameter
if (patternId)
    patternData(patternId);