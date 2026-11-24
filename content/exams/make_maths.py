"""Professional Skills for Biosciences (BIO-4008Y): mock maths tests.

The real maths test (assessment brief, Quizzes): week 12, in person, on paper, worth 10 % of the module.
Calculator allowed, no notes or phone; the Useful Equations sheet is given. Marked right or wrong.
About 30 minutes of questions, 2 hours allowed. Topics: the seven Maths for Bioscience lectures.

Every answer here is computed in this file, so the mark scheme cannot drift from the question.
Run:  python3 content/exams/make_maths.py
"""
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from make_genetics import P, mcq, text, num, Q  # noqa: E402

HUB = '01 Year 1/Professional Skills for Biosciences/Professional Skills for Biosciences'
NOTE = ('Same style as the week 12 maths test: calculator allowed, no notes, equations sheet given, '
        'each answer right or wrong. Aim for 30 to 40 minutes. Give numbers only (units are shown); '
        'scientific notation like 5.2e8 or 5.2 × 10^8 is fine.')
EQUATIONS = [
    ('Prefixes', 'G 10⁹ · M 10⁶ · k 10³ · m 10⁻³ · µ 10⁻⁶ · n 10⁻⁹ · p 10⁻¹² · f 10⁻¹⁵'),
    ('Magnification', 'magnification = image size / actual size'),
    ('Colony-forming units', 'CFU mL⁻¹ = (number of colonies × dilution factor) / volume plated (mL)'),
    ('Moles', 'moles (mol) = mass (g) / molar mass (g mol⁻¹)'),
    ('Molarity', 'molarity (mol L⁻¹) = moles / volume (L) = mass / (molar mass × volume (L))'),
    ('Dilution', 'M₁V₁ = M₂V₂'),
    ('Growth', 'N = N₀eᵏᵗ'),
    ('pH', 'pH = −log[H⁺];  pH = pKa + log([A⁻] / [HA])'),
    ('Straight line', 'y = mx + c'),
    ('Quadratic formula', 'x = (−b ± √(b² − 4ac)) / 2a'),
]

R = 0.02  # 2 % tolerance for rounding


def n(stem, value, unit='', working='', rtol=R, marks=1):
    return Q('', num(stem, value, marks=marks, rtol=rtol, unit=unit, working=working))


def m(stem, options, answer, explain):
    return Q('', mcq(stem, options, answer, explain, marks=1))


def sci(x, d=3):
    if x == 0:
        return '0'
    e = int(math.floor(math.log10(abs(x))))
    if -3 <= e <= 4:
        return f'{x:.{d}g}'
    return f'{x / 10 ** e:.{d}g} × 10^{e}'.replace('^', '<sup>') + '</sup>'


ln, log = math.log, math.log10

# ====================================================================== Mock 1
T1 = [
 n('Convert 3.5 µL into nL.', 3500, 'nL', '3.5 × 10⁻⁶ L ÷ 10⁻⁹ = <b>3500 nL</b> (µL → nL is × 10³).'),
 n('Convert 250 mm² into m².', 2.5e-4, 'm²', '1 m² = 10⁶ mm², so 250 ÷ 10⁶ = <b>2.5 × 10⁻⁴ m²</b>.'),
 n('A mitochondrion measures 12 mm on a micrograph taken at × 15 000 magnification. What is its actual length in µm?', 0.8, 'µm',
   'actual = image ÷ magnification = 12 mm ÷ 15 000 = 8 × 10⁻⁴ mm = <b>0.8 µm</b>.'),
 n('A culture contains 4.2 × 10⁸ cells mL⁻¹. It goes through three 1 in 10 dilutions. What is the concentration in the last tube (cells mL⁻¹)?', 4.2e5, 'cells mL⁻¹',
   '4.2 × 10⁸ × 10⁻³ = <b>4.2 × 10⁵ cells mL⁻¹</b>.'),
 n('100 µL of the 10⁻⁵ dilution of a culture gave 72 colonies. What was the concentration of the original culture (CFU mL⁻¹)?', 72e5 / 0.1, 'CFU mL⁻¹',
   '(72 × 10⁵) ÷ 0.1 mL = <b>7.2 × 10⁷ CFU mL⁻¹</b>.'),
 n('0.5 g of soil was suspended in 1.0 mL of water and serially diluted. 50 µL of the 10⁻⁴ dilution gave 120 colonies. How many CFU per gram of soil?', 120e4 / 0.05 / 0.5, 'CFU g⁻¹',
   '(120 × 10⁴) ÷ 0.05 mL = 2.4 × 10⁷ CFU mL⁻¹ of suspension; that mL held 0.5 g, so ÷ 0.5 = <b>4.8 × 10⁷ CFU g⁻¹</b>.'),
 n('How many moles are in 2.5 g of NaCl (Mr 58.44)?', 2.5 / 58.44, 'mol', '2.5 ÷ 58.44 = <b>0.0428 mol</b>.'),
 n('What mass of glucose (Mr 180.2) is needed for 250 mL of a 0.2 M solution?', 0.2 * 0.25 * 180.2, 'g', '0.2 mol L⁻¹ × 0.25 L × 180.2 = <b>9.01 g</b>.'),
 n('A 500 mL solution contains 14.6 g of NaCl (Mr 58.44). What is its molarity?', 14.6 / (58.44 * 0.5), 'M', '14.6 ÷ (58.44 × 0.5) = <b>0.500 M</b>.'),
 n('What volume of a 2 M stock is needed to make 400 mL of 50 mM solution?', 0.05 * 400 / 2, 'mL', 'V₁ = M₂V₂ ÷ M₁ = 0.05 × 400 ÷ 2 = <b>10 mL</b>.'),
 n('What is the pH of a solution with [H⁺] = 3.2 × 10⁻⁵ M?', -log(3.2e-5), '', '−log(3.2 × 10⁻⁵) = <b>4.49</b>.', rtol=0.005),
 n('A buffer contains 0.1 M acetic acid and 0.4 M sodium acetate (pKa 4.76). What is its pH?', 4.76 + log(4), '', '4.76 + log(0.4/0.1) = 4.76 + 0.60 = <b>5.36</b>.', rtol=0.005),
 m('Which expression equals log 6x³?', ['log 3x + log 2x²', 'log 6 + 3 log x²', 'log 12x³ − log 6', 'log 3x × log 2x²'], 0,
   'Law 1: log 3x + log 2x² = log(3x × 2x²) = log 6x³. Option C gives log 2x³.'),
 n('A population of 400 bacteria grows to 2500 in 6 hours. Using N = N₀eᵏᵗ, what is the growth constant k (h⁻¹)?', ln(2500 / 400) / 6, 'h⁻¹',
   'k = ln(N/N₀) ÷ t = ln(6.25) ÷ 6 = 1.833 ÷ 6 = <b>0.305 h⁻¹</b>.'),
 n('An isotope has a decay constant of −0.035 day⁻¹. What is its half-life in days?', ln(0.5) / -0.035, 'days', 't½ = ln 0.5 ÷ k = −0.693 ÷ −0.035 = <b>19.8 days</b>.'),
 n('What is the gradient of the straight line through (2, 5) and (6, 17)?', 3, '', '(17 − 5) ÷ (6 − 2) = 12 ÷ 4 = <b>3</b>.', rtol=0.001),
 n('For that line through (2, 5) and (6, 17), what is the y-intercept c?', -1, '', 'c = y − mx = 5 − 3 × 2 = <b>−1</b>.', rtol=0.001),
 n('A standard curve gives A = 0.045 × [protein] + 0.012 (protein in µg mL⁻¹). A sample reads A = 0.687. What is its protein concentration?', (0.687 - 0.012) / 0.045, 'µg mL⁻¹',
   '[protein] = (0.687 − 0.012) ÷ 0.045 = <b>15.0 µg mL⁻¹</b>.'),
 n('What is the gradient of a line perpendicular to y = 4x − 3?', -0.25, '', 'm₂ = −1/m₁ = <b>−0.25</b>.', rtol=0.001),
 n('Give the positive root of x² + 4x − 12 = 0.', 2, '', 'x = (−4 ± √(16 + 48)) ÷ 2 = (−4 ± 8) ÷ 2 → <b>2</b> or −6 (or factorise: (x + 6)(x − 2)).', rtol=0.001),
]

# ====================================================================== Mock 2
T2 = [
 n('Convert 0.075 mg into µg.', 75, 'µg', '0.075 × 10⁻³ g ÷ 10⁻⁶ = <b>75 µg</b>.'),
 n('How many µm are in 2.4 cm?', 24000, 'µm', '2.4 × 10⁻² m ÷ 10⁻⁶ = <b>2.4 × 10⁴ µm</b>.'),
 n('A cell 25 µm across appears 50 mm long in a drawing. What is the magnification?', 50e-3 / 25e-6, '', 'image ÷ actual = 50 × 10⁻³ m ÷ 25 × 10⁻⁶ m = <b>× 2000</b>.'),
 n('A 1.5 cm scale bar on an electron micrograph at × 30 000 represents what length in µm?', 1.5e-2 / 30000 / 1e-6, 'µm', '1.5 cm ÷ 30 000 = 5 × 10⁻⁵ cm = 5 × 10⁻⁷ m = <b>0.5 µm</b>.'),
 n('You want to go from 10⁹ cells mL⁻¹ to 10⁴ cells mL⁻¹ using 1 in 10 dilutions. How many dilution steps?', 5, '', '10⁹ → 10⁴ is a 10⁻⁵ dilution: <b>5</b> ten-fold steps.', rtol=0.001),
 n('10 µL of the 10⁻⁶ dilution of a yoghurt drink gave 48 colonies. CFU mL⁻¹ in the drink?', 48e6 / 0.01, 'CFU mL⁻¹', '(48 × 10⁶) ÷ 0.01 mL = <b>4.8 × 10⁹ CFU mL⁻¹</b>.'),
 m('Plates from a serial dilution gave 2104, 312, 41 and 3 colonies for 10⁻², 10⁻³, 10⁻⁴ and 10⁻⁵. Which plate should be used to calculate CFU?',
   ['10⁻²', '10⁻³', '10⁻⁴', '10⁻⁵'], 2, 'Use the plate in the countable range of about 30 to 300: 41 colonies at 10⁻⁴ (312 is just over 300).'),
 n('What is the molar mass of a compound if 0.25 mol weighs 34.0 g?', 34 / 0.25, 'g mol⁻¹', '34.0 ÷ 0.25 = <b>136 g mol⁻¹</b>.'),
 n('How many µmol are in 4.5 mg of TRIS (Mr 121.1)?', 4.5e-3 / 121.1 * 1e6, 'µmol', '4.5 × 10⁻³ g ÷ 121.1 = 3.72 × 10⁻⁵ mol = <b>37.2 µmol</b>.'),
 n('What is the molarity of a solution of 0.85 mg of NaCl (Mr 58.44) in 0.5 mL? Give your answer in mM.', 0.85e-3 / 58.44 / 0.5e-3 * 1e3, 'mM',
   '0.85 × 10⁻³ ÷ (58.44 × 0.5 × 10⁻³) = 0.0291 M = <b>29.1 mM</b>.'),
 n('How much glucose is in 60 mL of a 12 % (w/v) solution?', 0.12 * 60, 'g', '% (w/v) = g per 100 mL: 12 × 60 ÷ 100 = <b>7.2 g</b>.'),
 n('A drug stock is 20 mM. What volume of stock gives a final concentration of 10 µM in 5 mL of medium?', 10e-6 * 5 / 20e-3 * 1000, 'µL', 'V₁ = (10 × 10⁻⁶ × 5 mL) ÷ 20 × 10⁻³ = 2.5 × 10⁻³ mL = <b>2.5 µL</b>.'),
 n('What is [H⁺] in mol L⁻¹ for a solution of pH 8.3? Give it in nM.', 10 ** -8.3 * 1e9, 'nM', '10⁻⁸·³ = 5.01 × 10⁻⁹ M = <b>5.01 nM</b>.'),
 n('100 mL of 0.2 M acetic acid is mixed with 100 mL of 0.1 M sodium acetate (pKa 4.76). What is the pH?', 4.76 + log(0.05 / 0.1), '',
   'After mixing (200 mL): [HA] = 0.1 M, [A⁻] = 0.05 M. pH = 4.76 + log(0.05/0.1) = 4.76 − 0.30 = <b>4.46</b>.', rtol=0.005),
 n('A phosphate buffer (pKa 7.21) must be pH 7.51. What ratio [A⁻]/[HA] is needed?', 10 ** 0.3, '', 'log ratio = 7.51 − 7.21 = 0.30, so ratio = 10⁰·³ = <b>2.0</b>.'),
 n('Simplify log 50 + log 4 − log 2 to a single number.', 2, '', 'log(50 × 4 ÷ 2) = log 100 = <b>2</b>.', rtol=0.001),
 n('A yeast population of 5000 has k = 0.25 h⁻¹. How many cells after 8 hours (N = N₀eᵏᵗ)?', 5000 * math.exp(2), 'cells', '5000 × e^(0.25 × 8) = 5000 × e² = 5000 × 7.389 = <b>36 900 cells</b>.'),
 n('Find the y-intercept of the line 2x − 5y + 10 = 0.', 2, '', '5y = 2x + 10 → y = 0.4x + 2: <b>c = 2</b>.', rtol=0.001),
 n('A Lineweaver–Burk plot has y-intercept 0.025 (s µM⁻¹). What is Vmax (µM s⁻¹)?', 40, 'µM s⁻¹', 'y-intercept = 1/Vmax, so Vmax = 1 ÷ 0.025 = <b>40 µM s⁻¹</b>.'),
 n('Fish numbers follow y = 2x² − 24x + 300 (x in months). After how many months is the population lowest?', 6, 'months', 'Turning point at x = −b/2a = 24 ÷ 4 = <b>6 months</b> (y = 228).', rtol=0.001),
]

# ====================================================================== Mock 3
T3 = [
 n('Convert 0.0042 L into µL.', 4200, 'µL', '0.0042 ÷ 10⁻⁶ = <b>4200 µL</b>.'),
 n('A spherical cell has a diameter of 6 µm. What is its volume in µm³? (V = 4/3 πr³)', 4 / 3 * math.pi * 27, 'µm³', 'r = 3 µm; 4/3 × π × 27 = <b>113 µm³</b>.'),
 n('A tank measures 40 cm × 30 cm × 25 cm. What is its volume in litres?', 40 * 30 * 25 / 1000, 'L', '30 000 cm³ = 30 000 mL = <b>30 L</b>.'),
 n('A sewage sample: 10 µL of the 10⁻² dilution gave 80 colonies. What is the CFU mL⁻¹ of the sample?', 80e2 / 0.01, 'CFU mL⁻¹', '(80 × 10²) ÷ 0.01 = <b>8 × 10⁵ CFU mL⁻¹</b>.'),
 n('A culture has 3 × 10⁷ CFU mL⁻¹. You plate 100 µL from a 10⁻⁴ dilution. How many colonies do you expect?', 3e7 * 1e-4 * 0.1, 'colonies', '3 × 10⁷ × 10⁻⁴ = 3000 mL⁻¹; × 0.1 mL = <b>300 colonies</b>.'),
 n('What mass of CaCl₂ (Mr 111) is needed for 50 mL of a 150 mM solution?', 0.15 * 0.05 * 111, 'g', '0.15 × 0.05 × 111 = <b>0.833 g</b>.'),
 n('8.0 g of NaOH (Mr 40.0) is dissolved to make 400 mL. What is the molarity?', 8 / 40 / 0.4, 'M', '8.0 ÷ 40.0 = 0.2 mol; 0.2 ÷ 0.4 L = <b>0.5 M</b>.'),
 n('You need 30 mL of 80 mM MgSO₄ from a 1.5 M stock. What volume of stock (mL)?', 0.08 * 30 / 1.5, 'mL', '0.08 × 30 ÷ 1.5 = <b>1.6 mL</b> (plus 28.4 mL water).'),
 n('10 mL of 50 mM NaCl is diluted to 80 mL. What is the final concentration in mM?', 50 * 10 / 80, 'mM', '50 × 10 ÷ 80 = <b>6.25 mM</b>.'),
 n('What is the pH of 0.025 M HCl (fully dissociated)?', -log(0.025), '', '−log(0.025) = <b>1.60</b>.', rtol=0.005),
 n('A buffer of 0.05 M NaH₂PO₄ and 0.2 M K₂HPO₄ (pKa 7.21). What is the pH?', 7.21 + log(4), '', '7.21 + log(0.2/0.05) = 7.21 + 0.60 = <b>7.81</b>.', rtol=0.005),
 m('A buffer contains more HA than A⁻. Its pH is:', ['above the pKa', 'below the pKa', 'equal to the pKa', 'always 7'], 1, 'log([A⁻]/[HA]) is negative when [HA] > [A⁻], so pH < pKa.'),
 n('Write 3 log 2 + log 5 as the log of a single number. What is that number?', 40, '', 'log 2³ + log 5 = log(8 × 5) = <b>log 40</b>.', rtol=0.001),
 n('Measles cases rose from 600 to 1500 in 2 years. What is k (year⁻¹)?', ln(2.5) / 2, 'year⁻¹', 'ln(1500/600) ÷ 2 = ln 2.5 ÷ 2 = <b>0.458 year⁻¹</b>.'),
 n('A population doubles every 20 minutes. What is k (min⁻¹)?', ln(2) / 20, 'min⁻¹', 'ln 2 ÷ 20 = <b>0.0347 min⁻¹</b>.'),
 n('A ln N against t graph has gradient 0.12 day⁻¹ and y-intercept 4.6. What was N₀?', math.exp(4.6), '', 'ln N₀ = 4.6, so N₀ = e⁴·⁶ = <b>99.5 (about 100)</b>.'),
 n('DMSP was 2.8 mol L⁻¹ at 5 min and 5.6 mol L⁻¹ at 10 min. What is the gradient of the line?', 0.56, 'mol L⁻¹ min⁻¹', '(5.6 − 2.8) ÷ (10 − 5) = <b>0.56</b>.'),
 n('Line A: y = 0.5x + 3. A parallel line passes through (4, 10). What is its y-intercept?', 8, '', 'same m = 0.5; c = 10 − 0.5 × 4 = <b>8</b>.', rtol=0.001),
 n('Shrimp numbers follow y = −0.064x² + 2.4977x + 2.3273 (x = salinity, g L⁻¹). At what salinity are shrimp highest?', 2.4977 / (2 * 0.064), 'g L⁻¹', 'x = −b/2a = −2.4977 ÷ (2 × −0.064) = <b>19.5 g L⁻¹</b>.'),
 n('Give the negative root of 2x² + 3x − 9 = 0.', -3, '', 'x = (−3 ± √(9 + 72)) ÷ 4 = (−3 ± 9) ÷ 4 → 1.5 or <b>−3</b>.', rtol=0.001),
]

PAPERS = [('maths-mock-1', 'Maths test mock 1', T1), ('maths-mock-2', 'Maths test mock 2', T2), ('maths-mock-3', 'Maths test mock 3', T3)]


def build():
    papers = []
    for pid, title, qs in PAPERS:
        for i, q in enumerate(qs):
            q['id'] = f'{pid}-q{i + 1}'
            for j, p in enumerate(q['parts']):
                p['id'] = f'{pid}-q{i + 1}{"abcdefghijkl"[j]}'
                if p['type'] == 'num':
                    v = p['value']
                    p['value'] = float(f'{v:.4g}') if v else 0.0
        total = sum(p['marks'] for q in qs for p in q['parts'])
        papers.append({'id': pid, 'title': title, 'lecture': 'Week 12 maths test', 'hub': HUB, 'marks': total, 'note': NOTE,
                       'printable': True, 'duration': '40 minutes (2 hours allowed in the real test)', 'code': 'BIO-4008Y',
                       'equations': EQUATIONS, 'questions': qs})
    out = {'subject': 'Professional Skills for Biosciences', 'module': 'BIO-4008Y', 'keep_questions': True, 'papers': papers}
    json.dump(out, open(os.path.join(HERE, 'professional-skills.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for p in papers:
        print(p['id'], len(p['questions']), 'questions', p['marks'], 'marks')


if __name__ == '__main__':
    build()
