"""Practice papers for the BIO-4018A In-Class Data Analysis Test (9 Nov): 10 MCQs x 2 marks, interpreting data.
Draws the figures (gels, plasmid maps, standard curves) to scale into assets/exam-img/ and returns the papers.
Imported by make_genetics.py."""
import math
import os

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.ndimage import gaussian_filter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(os.path.dirname(HERE)), 'assets', 'exam-img')
IMG = 'assets/exam-img/'
LADDER = [20000, 10000, 7000, 5000, 4000, 3000, 2000, 1500, 1000, 700, 500, 400, 300, 200, 75]


def frags(length, sites):
    s = sorted(sites)
    if len(s) < 2:
        return [length]
    return sorted([s[i + 1] - s[i] for i in range(len(s) - 1)] + [length - s[-1] + s[0]], reverse=True)


# ------------------------------------------------------------------ figures
def gel(name, lanes, caption):
    """lanes: list of lists of fragment sizes ('L' for the 1 kb ladder)."""
    H, W = 560, 90 * len(lanes) + 40
    img = np.zeros((H, W))
    y = lambda bp: 40 + (math.log10(20000) - math.log10(bp)) / (math.log10(20000) - math.log10(75)) * (H - 90)
    for i, lane in enumerate(lanes):
        x0 = 40 + i * 90 + 15
        bands = LADDER if lane == 'L' else lane
        for bp in bands:
            yy = int(y(bp))
            inten = 1.0 if lane != 'L' else (1.0 if bp in (5000, 1500, 500) else 0.6)
            img[yy:yy + 5, x0:x0 + 58] = max(img[yy, x0], inten)
    img = gaussian_filter(img, 1.6) * 1.4
    img += np.random.default_rng(7).normal(0, 0.015, img.shape)
    fig = plt.figure(figsize=(W / 100 + 1.1, H / 100 + 0.2), dpi=130)
    ax = fig.add_axes([0.16, 0.02, 0.83, 0.93])
    ax.imshow(np.clip(img, 0, 1), cmap='gray', vmin=0, vmax=1, aspect='auto', extent=(0, W, H, 0))
    ax.set_xticks([40 + i * 90 + 44 for i in range(len(lanes))])
    ax.set_xticklabels([str(i + 1) for i in range(len(lanes))])
    ax.xaxis.tick_top()
    ax.set_yticks([y(b) + 2 for b in LADDER])
    ax.set_yticklabels([str(b) for b in LADDER], fontsize=8)
    ax.set_ylabel('base pairs', fontsize=9)
    ax.tick_params(length=0)
    for s in ax.spines.values():
        s.set_visible(False)
    fig.savefig(os.path.join(OUT, name), facecolor='white')
    plt.close(fig)
    return IMG + name


def plasmid(name, length, sites, genes, title):
    """sites: {enzyme: position}; genes: [(label, start, end, colour)] drawn clockwise."""
    fig = plt.figure(figsize=(6.4, 6.4), dpi=130)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(-1.75, 1.75)
    ax.set_ylim(-1.75, 1.75)
    ax.axis('off')
    ang = lambda p: math.pi / 2 - 2 * math.pi * p / length
    t = np.linspace(0, 2 * math.pi, 400)
    ax.plot(np.cos(t), np.sin(t), color='#222', lw=2.2)
    for k in range(0, length, 1000):
        a = ang(k)
        ax.plot([0.97 * math.cos(a), 1.03 * math.cos(a)], [0.97 * math.sin(a), 1.03 * math.sin(a)], color='#222', lw=1)
        if k:
            ax.text(0.9 * math.cos(a), 0.9 * math.sin(a), str(k), fontsize=7, ha='center', va='center', color='#555')
    for label, s, e, col in genes:
        ts = np.linspace(ang(s), ang(e), 80)
        ax.plot(0.84 * np.cos(ts), 0.84 * np.sin(ts), color=col, lw=9, solid_capstyle='butt', alpha=.85)
        m = ang((s + e) / 2)
        ax.text(0.66 * math.cos(m), 0.66 * math.sin(m), label, fontsize=10, ha='center', va='center', weight='bold', color='#333')
    placed = []
    for enz, p in sorted(sites.items(), key=lambda kv: kv[1]):
        a = ang(p)
        r = 1.3
        for q in placed:
            if abs(q - a) < 0.38:
                r += 0.13
        placed.append(a)
        ax.plot([math.cos(a), 1.12 * math.cos(a)], [math.sin(a), 1.12 * math.sin(a)], color='#1d4ed8', lw=1.2)
        ax.text(r * math.cos(a), r * math.sin(a), f'{enz} ({p})', fontsize=9, ha='center', va='center', color='#1d4ed8')
    ax.text(0, 0.06, title, ha='center', fontsize=13, weight='bold')
    ax.text(0, -0.1, f'{length} bp', ha='center', fontsize=10)
    fig.savefig(os.path.join(OUT, name), facecolor='white')
    plt.close(fig)
    return IMG + name


def curve(name, xs, means, sds, m, c, r2_shown=None, xlabel='DNA concentration (mg/mL)', ylabel='Absorbance at 260 nm (AU)', eq=True):
    fig = plt.figure(figsize=(6.6, 4.2), dpi=130)
    ax = fig.add_axes([0.13, 0.14, 0.83, 0.8])
    ax.errorbar(xs, means, yerr=sds, fmt='o', color='#2563eb', capsize=3, ms=6)
    xx = np.linspace(0, max(xs) * 1.04, 10)
    ax.plot(xx, m * xx + c, ':', color='#1e3a8a')
    if eq:
        s = f'y = {m:g}x {"+" if c >= 0 else "−"} {abs(c):g}' + (f'\nR² = {r2_shown}' if r2_shown else '')
        ax.text(0.04, 0.9, s, transform=ax.transAxes, fontsize=10, va='top')
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    ax.grid(alpha=.25)
    ax.set_xlim(left=-0.002)
    ax.set_ylim(bottom=min(0, min(means) - 0.1))
    fig.savefig(os.path.join(OUT, name), facecolor='white')
    plt.close(fig)
    return IMG + name


def ladder_curve(name, m, c):
    """distance (mm) against log10(size) for the 1 kb ladder, with the fitted line."""
    sizes = [10000, 7000, 5000, 4000, 3000, 2000, 1500, 1000, 700, 500]
    rng = np.random.default_rng(3)
    xs = [math.log10(s) for s in sizes]
    ys = [m * x + c + rng.normal(0, 0.8) for x in xs]
    fig = plt.figure(figsize=(6.6, 4.2), dpi=130)
    ax = fig.add_axes([0.13, 0.14, 0.83, 0.8])
    ax.plot(xs, ys, 'o', color='#2563eb')
    xx = np.linspace(2.6, 4.1, 10)
    ax.plot(xx, m * xx + c, ':', color='#1e3a8a')
    ax.text(0.55, 0.9, f'y = {m:g}x + {c:g}\nR² = 0.995', transform=ax.transAxes, fontsize=10, va='top')
    ax.set_xlabel('log₁₀(fragment size in bp)')
    ax.set_ylabel('Distance migrated (mm)')
    ax.grid(alpha=.25)
    fig.savefig(os.path.join(OUT, name), facecolor='white')
    plt.close(fig)
    return IMG + name


# ------------------------------------------------------------------ question helpers
def mcq(stem, options, answer, explain):
    return {'type': 'mcq', 'stem': stem, 'options': options, 'answer': answer, 'explain': explain, 'marks': 2}


def Q(stem, *parts, img=None, table=None):
    q = {'stem': stem, 'parts': list(parts)}
    if img:
        q['img'] = img
    if table:
        q['table'] = table
    return q


def papers():
    os.makedirs(OUT, exist_ok=True)
    out = []

    # ============================================================== Mock 1
    L1, S1 = 5400, {'EcoRI': 0, 'BamHI': 900, 'SalI': 3100}
    f = lambda *e: frags(L1, [S1[x] for x in e])
    assert f('EcoRI', 'BamHI') == [4500, 900] and f('EcoRI', 'SalI') == [3100, 2300] and f('BamHI', 'SalI') == [3200, 2200]
    assert f('EcoRI', 'BamHI', 'SalI') == [2300, 2200, 900]
    g1 = gel('dat1_gel.png', ['L', f('EcoRI'), f('BamHI'), f('SalI'), f('EcoRI', 'BamHI'), f('EcoRI', 'SalI'), f('BamHI', 'SalI'), f('EcoRI', 'BamHI', 'SalI'), 'L'], '')
    m1, c1 = 21.85, 0.0021
    xs = [0, 0.02, 0.03, 0.04, 0.06, 0.08]
    rng = np.random.default_rng(11)
    ys = [round(m1 * x + c1 + (rng.normal(0, 0.03) if x else 0), 3) for x in xs]
    cv1 = curve('dat1_curve.png', xs, ys, [0, .03, .04, .05, .05, .06], m1, c1)
    p1 = plasmid('dat1_map.png', 4600, {'EcoRI': 0, 'HindIII': 320, 'BglII': 1650, 'NcoI': 2210, 'XbaI': 2480, 'KpnI': 3900, 'ClaI': 4120},
                 [('KanR', 450, 1500, '#86efac'), ('ori', 2600, 3200, '#fde047'), ('lacZα', 3950, 4400, '#93c5fd')], 'pDAT1')
    out.append({'id': 'dat-1', 'title': 'Data analysis practice test 1', 'lecture': 'In-class test (9 Nov)', 'marks': 20,
                'hub': '01 Year 1/Molecular Biology and Genetics/Molecular Biology and Genetics', 'note': 'Calculator allowed. The real test is 40 minutes.',
                'questions': [
        Q('<strong>Figure 1.</strong> Restriction digests of plasmid pXY. Lanes 1 and 9: 1 kb ladder. Lane 2 EcoRI; lane 3 BamHI; lane 4 SalI; lane 5 EcoRI + BamHI; lane 6 EcoRI + SalI; lane 7 BamHI + SalI; lane 8 EcoRI + BamHI + SalI.',
          mcq('How many BamHI sites are there in pXY?', ['0', '1', '2', '3', '4'], 1, 'Lane 3 has one band. Cutting a circular plasmid once opens it into one linear fragment, so there is one site.'),
          mcq('What is the approximate size of pXY?', ['3400 bp', '4400 bp', '5400 bp', '6400 bp', '7400 bp'], 2, 'The single-digest bands (lanes 2 to 4) run between the 5000 and 7000 bp markers, just above 5000. The double digests also add up to about 5400 (900 + 4500).'),
          mcq('What is the shortest distance between the EcoRI and SalI sites?', ['About 900 bp', 'About 2200 bp', 'About 2300 bp', 'About 3100 bp', 'About 5400 bp'], 2, 'With one site each, EcoRI + SalI (lane 6) gives two fragments. The smaller one, about 2300 bp, is the shorter distance round the circle between them.'),
          mcq('The smallest fragment in lane 8 was produced by digestion with which enzymes?', ['EcoRI alone', 'EcoRI and BamHI', 'EcoRI and SalI', 'BamHI and SalI', 'SalI alone'], 1, 'The 900 bp fragment is also in lane 5 (EcoRI + BamHI) but not in lanes 6 or 7, so it has an EcoRI end and a BamHI end.'),
          img=g1),
        Q('BamHI cuts double-stranded DNA.',
          mcq('The BamHI recognition site on one strand is 5′-GGATCC-3′. What is the sequence of the site on the other strand?', ['5′-CCTAGG-3′', '5′-GGATCC-3′', '5′-CCATGG-3′', '5′-GATC-3′', '5′-AAGCTT-3′'], 1, 'Recognition sites are palindromic: the complementary strand reads 3′-CCTAGG-5′, which is 5′-GGATCC-3′ read in its own 5′→3′ direction.')),
        Q('<strong>Figure 2.</strong> Restriction map of plasmid pDAT1 showing the kanamycin resistance gene (KanR, 450 to 1500), the origin of replication (ori) and lacZα.',
          mcq('You want to cut out the whole KanR gene on the smallest possible fragment. Which pair of enzymes should you use?', ['EcoRI and BglII', 'HindIII and BglII', 'HindIII and NcoI', 'BglII and NcoI', 'EcoRI and KpnI'], 1, 'HindIII (320) and BglII (1650) sit either side of KanR (450 to 1500) and are the closest pair that does not cut inside it: a 1330 bp fragment. EcoRI + BglII also works but gives 1650 bp; HindIII + NcoI gives 1890 bp.'),
          mcq('What size fragments would a HindIII + XbaI double digest give?', ['320 and 4280 bp', '2160 and 2440 bp', '2480 and 2120 bp', '1330 and 3270 bp', '2160 bp only'], 1, 'HindIII 320 to XbaI 2480 is 2160 bp; the rest of the 4600 bp circle is 2440 bp.'),
          img=p1),
        Q('<strong>Figure 3.</strong> Absorbance of DNA solutions of different concentrations (mean ± SD of three readings).',
          mcq('What absorbance would you expect for a DNA solution of 0.04 mg/mL?', ['0.81', '0.85', '0.88', '0.91', '0.94'], 2, 'Use the equation: y = (21.85 × 0.04) + 0.0021 = 0.876, so 0.88.'),
          mcq('What DNA concentration would give an absorbance of 1.20?', ['0.051 mg/mL', '0.053 mg/mL', '0.055 mg/mL', '0.057 mg/mL', '0.059 mg/mL'], 2, 'Rearrange for x: x = (1.20 − 0.0021) ÷ 21.85 = 0.0548, so 0.055 mg/mL.'),
          mcq('An unknown was diluted by adding 50 µL of it to 950 µL of TE buffer. The diluted sample gave an absorbance of 0.66. What was the concentration of the undiluted unknown?', ['0.030 mg/mL', '0.30 mg/mL', '0.60 mg/mL', '0.66 mg/mL', '6.0 mg/mL'], 2, 'Diluted: x = (0.66 − 0.0021) ÷ 21.85 = 0.0301 mg/mL. 50 µL in 1000 µL is a 1 in 20 dilution, so 0.0301 × 20 = 0.60 mg/mL.'),
          img=cv1),
    ]})

    # ============================================================== Mock 2
    m2, c2 = -38.2, 160.5
    lc = ladder_curve('dat2_ladder.png', m2, c2)
    size_at = lambda d: 10 ** ((d - c2) / m2)
    assert 2100 < size_at(33) < 2250
    L2, S2 = 4800, {'XhoI': 0, 'NcoI': 1200, 'KpnI': 2000}
    f2 = lambda *e: frags(L2, [S2[x] for x in e])
    assert f2('XhoI', 'NcoI') == [3600, 1200] and f2('XhoI', 'KpnI') == [2800, 2000] and f2('NcoI', 'KpnI') == [4000, 800]
    rng = np.random.default_rng(5)
    xs2 = [0, 0.02, 0.03, 0.04, 0.06, 0.08]
    m2c, c2c = 19.6, 0.012
    ys2 = [round(m2c * x + c2c + (rng.normal(0, 0.02) if x else -0.02), 3) for x in xs2]
    ys2[2] = round(m2c * 0.03 + c2c + 0.21, 3)     # one clearly anomalous mean
    cv2 = curve('dat2_curve.png', xs2, ys2, [0.01, .02, .09, .03, .03, .04], m2c, c2c)
    out.append({'id': 'dat-2', 'title': 'Data analysis practice test 2', 'lecture': 'In-class test (9 Nov)', 'marks': 20,
                'hub': '01 Year 1/Molecular Biology and Genetics/Molecular Biology and Genetics', 'note': 'Calculator allowed. The real test is 40 minutes.',
                'questions': [
        Q('A standard curve was made from DNA sample A (0.5 mg/mL). Each tube was made up to 1000 µL with TE buffer.',
          mcq('Tube 3 contained 80 µL of sample A and 920 µL of TE buffer. What is its DNA concentration?', ['0.004 mg/mL', '0.02 mg/mL', '0.04 mg/mL', '0.08 mg/mL', '0.4 mg/mL'], 2, '80 µL in 1000 µL is a 0.08 dilution: 0.5 × 0.08 = 0.04 mg/mL.'),
          mcq('The three readings for one tube were 0.82, 0.86 and 0.87. What is the mean?', ['0.82', '0.84', '0.85', '0.86', '0.87'], 2, '(0.82 + 0.86 + 0.87) ÷ 3 = 2.55 ÷ 3 = 0.85.'),
          mcq('Tube 6 (TE buffer only) read −0.03 after zeroing. What does this mean?', ['The spectrophotometer is broken', 'The DNA has degraded', 'It is within normal instrument error, so the readings can be used', 'Tube 6 contained the most DNA', 'The wavelength was set wrongly'], 2, 'No instrument reads exactly zero. Readings within about ±0.1 of zero for the blank are normal; this is one reason readings are taken in triplicate.')),
        Q('<strong>Figure 4.</strong> Mean absorbance at 260 nm (± SD, n = 3) of DNA solutions of known concentration.',
          mcq('Which of these is the independent variable plotted on the x-axis?', ['Absorbance', 'DNA concentration', 'Wavelength', 'Time', 'R²'], 1, 'The concentration is what was set by the dilutions; absorbance is measured in response, so it goes on the y-axis.'),
          mcq('Which concentration\'s mean lies furthest from the trend line?', ['0.02 mg/mL', '0.03 mg/mL', '0.04 mg/mL', '0.06 mg/mL', '0.08 mg/mL'], 1, 'The 0.03 mg/mL point sits well above the line (and has the largest error bar), suggesting a pipetting error in that dilution.'),
          mcq('The diluted unknown (1 in 20) read 0.50. What was the concentration of the original sample?', ['0.025 mg/mL', '0.25 mg/mL', '0.50 mg/mL', '0.75 mg/mL', '5.0 mg/mL'], 2, 'x = (0.50 − 0.012) ÷ 19.6 = 0.0249 mg/mL in the diluted sample; × 20 = 0.50 mg/mL.'),
          img=cv2),
        Q('<strong>Figure 5.</strong> Distance migrated by the 1 kb ladder fragments plotted against log₁₀(fragment size).',
          mcq('A fragment from a digest migrated 33 mm. What is its approximate size?', ['1700 bp', '2200 bp', '2700 bp', '3200 bp', '3700 bp'], 1, 'log₁₀(size) = (33 − 160.5) ÷ −38.2 = 3.34; 10³·³⁴ ≈ 2200 bp.'),
          mcq('Why is log₁₀(size) plotted rather than size itself?', ['To make the numbers smaller', 'Distance migrated is roughly proportional to log(size), so the plot is a straight line', 'Larger fragments move further', 'The ladder is measured in log units', 'So that R² is exactly 1'], 1, 'Migration distance falls linearly with the log of fragment size, so plotting log(size) gives a straight line you can read sizes from.'),
          img=lc),
        Q('A 4800 bp plasmid was cut with XhoI, NcoI and KpnI. XhoI is placed at position 0.',
          mcq('What is the shortest distance between the NcoI and KpnI sites?', ['800 bp', '1200 bp', '2000 bp', '2800 bp', '4000 bp'], 0, 'NcoI + KpnI gives 800 + 4000 bp, so they are 800 bp apart the short way round.'),
          mcq('Which fragments would the triple digest (XhoI + NcoI + KpnI) give?', ['1200 + 3600 bp', '800 + 1200 + 2800 bp', '800 + 2000 + 2000 bp', '400 + 1600 + 2800 bp', '1200 + 1600 + 2000 bp'], 1, 'NcoI is 1200 from XhoI and KpnI is 2000 from XhoI (only this places them 800 apart). Round the circle: 0→1200 = 1200, 1200→2000 = 800, 2000→4800 = 2800.'),
          table={'head': ['Digest', 'Fragments (bp)'], 'rows': [['XhoI', '4800'], ['NcoI', '4800'], ['KpnI', '4800'], ['XhoI + NcoI', '1200 + 3600'], ['XhoI + KpnI', '2000 + 2800'], ['NcoI + KpnI', '800 + 4000']]}),
    ]})

    # ============================================================== Mock 3 (pBR322)
    L3 = 4361
    S3 = {'EcoRI': 4359, 'BamHI': 375, 'PstI': 3609}
    f3 = lambda *e: frags(L3, [S3[x] for x in e])
    g3 = gel('dat3_gel.png', ['L', f3('EcoRI'), f3('BamHI'), f3('PstI'), f3('EcoRI', 'BamHI'), f3('EcoRI', 'PstI'), f3('BamHI', 'PstI'), f3('EcoRI', 'BamHI', 'PstI'), 'L'], '')
    assert f3('EcoRI', 'BamHI', 'PstI') == [3234, 750, 377]
    p3 = plasmid('dat3_map.png', L3, {'EcoRI': 4359, 'EcoRV': 187, 'BamHI': 375, 'StyI': 1369, 'PvuII': 2064, 'PstI': 3609, 'ScaI': 3846, 'SspI': 4168},
                 [('TcR', 86, 1276, '#86efac'), ('ori', 2535, 3123, '#fde047'), ('AmpR', 3293, 4153, '#fca5a5')], 'pBR322')
    rng = np.random.default_rng(21)
    xs3 = [0, 0.01, 0.02, 0.04, 0.06, 0.08]
    ys3 = [round(23.1 * x - 0.004 + (rng.normal(0, 0.025) if x else 0.003), 3) for x in xs3]
    cv3 = curve('dat3_curve.png', xs3, ys3, [0.01, .02, .03, .04, .05, .05], 23.1, -0.004)
    out.append({'id': 'dat-3', 'title': 'Data analysis practice test 3', 'lecture': 'In-class test (9 Nov)', 'marks': 20,
                'hub': '01 Year 1/Molecular Biology and Genetics/Molecular Biology and Genetics', 'note': 'Calculator allowed. The real test is 40 minutes.',
                'questions': [
        Q('<strong>Figure 6.</strong> Restriction digests of pBR322. Lanes 1 and 9: 1 kb ladder. Lane 2 EcoRI; lane 3 BamHI; lane 4 PstI; lane 5 EcoRI + BamHI; lane 6 EcoRI + PstI; lane 7 BamHI + PstI; lane 8 EcoRI + BamHI + PstI.',
          mcq('How many PstI sites are there in pBR322?', ['0', '1', '2', '3', '4'], 1, 'Lane 4 shows one band the size of the whole plasmid: one cut opens the circle.'),
          mcq('What is the shortest distance between the EcoRI and BamHI sites?', ['About 75 bp', 'About 380 bp', 'About 750 bp', 'About 1100 bp', 'About 3200 bp'], 1, 'Lane 5 (EcoRI + BamHI) gives a small fragment just under the 400 bp marker and a large one of about 4000 bp.'),
          mcq('Which fragment in lane 8 has an EcoRI end and a PstI end?', ['About 380 bp', 'About 750 bp', 'About 1100 bp', 'About 3200 bp', 'About 4000 bp'], 1, 'The 750 bp fragment is also in lane 6 (EcoRI + PstI) but not in lanes 5 or 7.'),
          mcq('In which lane is there a fragment of about 1100 bp?', ['Lane 4', 'Lane 5', 'Lane 6', 'Lane 7', 'Lane 8'], 3, 'BamHI (375) to PstI (3609) is 3234 bp one way and 1127 bp the other, so the BamHI + PstI lane (7). In the triple digest that 1127 bp stretch is cut again by EcoRI into 750 + 377.'),
          img=g3),
        Q('<strong>Figure 7.</strong> Restriction map of pBR322 showing the tetracycline (TcR, 86 to 1276) and ampicillin (AmpR, 3293 to 4153) resistance genes.',
          mcq('You want the whole AmpR gene on the smallest possible fragment. Which pair of enzymes should you use?', ['PstI and EcoRI', 'PvuII and SspI', 'PvuII and EcoRI', 'StyI and EcoRI', 'ScaI and SspI'], 1, 'PstI and ScaI cut inside AmpR. PvuII (2064) and SspI (4168) flank it: 2104 bp. PvuII + EcoRI also flanks it but is larger (2295 bp).'),
          mcq('Which of these enzymes cuts inside the TcR gene?', ['EcoRI', 'BamHI', 'PstI', 'ScaI', 'SspI'], 1, 'BamHI at 375 lies inside TcR (86 to 1276). Inserting DNA there inactivates tetracycline resistance.'),
          img=p3),
        Q('PstI recognises the sequence 5′-CTGCAG-3′.',
          mcq('What is the sequence of the PstI site on the other strand, written 5′ to 3′?', ['5′-GACGTC-3′', '5′-CTGCAG-3′', '5′-GTCGAC-3′', '5′-CAGCTG-3′', '5′-AAGCTT-3′'], 1, 'The site is palindromic: the complementary strand is 3′-GACGTC-5′, which reads 5′-CTGCAG-3′.'),
          mcq('A DNA solution is 0.05 mg/mL. What is this in µg/mL?', ['0.5 µg/mL', '5 µg/mL', '50 µg/mL', '500 µg/mL', '5000 µg/mL'], 2, '1 mg = 1000 µg, so 0.05 mg/mL × 1000 = 50 µg/mL.')),
        Q('<strong>Figure 8.</strong> Standard curve: mean absorbance at 260 nm (± SD, n = 3) of DNA solutions of known concentration.',
          mcq('What DNA concentration would give an absorbance of 0.95?', ['0.037 mg/mL', '0.039 mg/mL', '0.041 mg/mL', '0.043 mg/mL', '0.045 mg/mL'], 2, 'x = (0.95 + 0.004) ÷ 23.1 = 0.0413, so 0.041 mg/mL. Use the equation; reading off the graph is not precise enough when the options are this close.'),
          mcq('What is the most likely R² value for this line?', ['0.0', '0.1 to 0.5', '0.5 to 0.9', 'Greater than 0.9 but less than 1.0', '1.0'], 3, 'The points lie very close to the straight trend line but not exactly on it, so R² is close to, but below, 1.0.'),
          img=cv3),
    ]})
    for p in out:
        assert sum(len(q['parts']) for q in p['questions']) == 10, p['id']
    return out


if __name__ == '__main__':
    for p in papers():
        print(p['id'], sum(len(q['parts']) for q in p['questions']), 'questions')
