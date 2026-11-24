"""Biological Chemistry (BIO-4017Y) mock papers in the format of the January exam.

Format (from the 2025-26 January paper and the module's assessment brief):
  2 hours, 100 marks, all questions, no notes. Equations sheet given.
  Section A: 20 multiple-choice questions, 5 options, 2.5 marks each (50 marks)
  Section B: 5 short-answer questions, 50 marks (14 + 15 + 10 + 5 + 6)
The online formative test (mock exam) uses the same style of questions.

These papers are 'printable': the exam page can print them as a paper to do by hand,
and then the answers are entered and marked on the site.

Run:  python3 content/exams/make_chemistry.py
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from make_genetics import P, mcq, text, num, Q  # noqa: E402

HUB = '01 Year 1/Biological Chemistry/Biological Chemistry'
NOTE = ('Same format as the January exam and the online mock: Section A, 20 multiple-choice questions '
        '(2.5 marks each); Section B, 5 short-answer questions. Show working and units in Section B. '
        'Aim for 2 hours.')
EQUATIONS = [
    ('pH', 'pH = −log₁₀[H₃O⁺];  pOH = −log₁₀[OH⁻];  pH + pOH = 14 (25 °C)'),
    ('pKa', 'pKa = −log₁₀ Ka'),
    ('Henderson–Hasselbalch', 'pH = pKa + log₁₀([A⁻] / [HA])'),
    ('Moles and concentration', 'n = m / Mr;  c = n / V;  C₁V₁ = C₂V₂'),
    ('Gibbs energy', 'ΔG = ΔH − TΔS'),
    ('Equilibrium', 'ΔG° = −RT ln K;  ΔG = ΔG° + RT ln Q'),
    ('Redox', 'ΔE°′ = E°′(acceptor, reduced) − E°′(donor, oxidised);  ΔG°′ = −nFΔE°′'),
    ('Beer–Lambert law', 'A = ε c l'),
    ('Light', 'c = λν;  E = hν = hc / λ'),
    ('Constants', 'R = 8.314 J mol⁻¹ K⁻¹;  F = 96 485 C mol⁻¹;  h = 6.626 × 10⁻³⁴ J s;  c = 3.00 × 10⁸ m s⁻¹;  T (K) = T (°C) + 273.15'),
]

M = 2.5  # marks per Section A question


def A(stem, options, answer, explain):
    q = Q('', mcq(stem, options, answer, explain, marks=M))
    q['section'] = 'A'
    return q


def B(stem, *parts, table=None):
    q = Q(stem, *parts, table=table)
    q['section'] = 'B'
    return q


# ====================================================================== Mock paper 1
P1 = [
 A('How many valence electrons does a sulfur atom (Z = 16) have?', ['2', '4', '6', '8', '16'], 2,
   'Sulfur is 1s² 2s² 2p⁶ 3s² 3p⁴: the outer (n = 3) shell holds 2 + 4 = 6 electrons, the same as oxygen in the group above.'),
 A('Which is the ground-state electron configuration of phosphorus (Z = 15)?',
   ['1s² 2s² 2p⁶ 3s² 3p³', '1s² 2s² 2p⁶ 3s¹ 3p⁴', '1s² 2s² 2p⁶ 3p⁵', '1s² 2s² 2p⁷ 3s² 3p²', '1s² 2s² 2p⁶ 3s² 3p¹ 3d²'], 0,
   'Fill in order 1s, 2s, 2p, 3s, 3p: 2 + 2 + 6 + 2 + 3 = 15. The 3p³ outer subshell gives phosphorus a valency of 3 (or 5).'),
 A('Which bond is the most polar?', ['C–H', 'C–C', 'N–H', 'O–H', 'C–S'], 3,
   'Polarity follows the electronegativity difference. O (3.4) and H (2.2) differ most; C–C is non-polar and C–H and C–S are almost non-polar.'),
 A('Which compound can form hydrogen bonds with other molecules of itself?',
   ['CH₄', 'CH₃OCH₃ (dimethyl ether)', 'CH₃CH₂OH (ethanol)', 'CH₃Cl', 'CO₂'], 2,
   'A hydrogen bond needs an H bonded to N, O or F (donor) and a lone pair on N, O or F (acceptor). Only ethanol has an O–H. The ether has an O acceptor but no O–H donor.'),
 A('What is the hybridisation of each carbon atom in ethene, H₂C=CH₂?', ['sp', 'sp²', 'sp³', 'sp³d', 'unhybridised'], 1,
   'Each carbon forms three σ bonds (two C–H and one C–C) from three sp² orbitals in a trigonal plane, 120° apart. The left-over p orbital forms the π bond.'),
 A('Which of these species is a nucleophile?', ['H⁺', 'BF₃', 'NH₃', 'CH₃⁺', 'Na⁺'], 2,
   'A nucleophile donates an electron pair. NH₃ has a lone pair on N. The other four are electron-pair acceptors (electrophiles or Lewis acids) or, for Na⁺, a spectator ion.'),
 A('What is the conjugate base of the dihydrogen phosphate ion, H₂PO₄⁻?', ['H₃PO₄', 'HPO₄²⁻', 'PO₄³⁻', 'H₂PO₄', 'OH⁻'], 1,
   'A conjugate base is the acid minus one H⁺: H₂PO₄⁻ → HPO₄²⁻ + H⁺. H₃PO₄ is its conjugate acid.'),
 A('Hydrolysis of ATP to ADP and Pᵢ has ΔG°′ = −30.5 kJ mol⁻¹. This means that, under standard conditions, the reaction is:',
   ['endergonic and spontaneous', 'exergonic and spontaneous', 'endothermic', 'at equilibrium', 'exergonic but never able to happen in a cell'], 1,
   'ΔG < 0 means exergonic: energy is released and the reaction is spontaneous (it can happen without an energy input). ΔG says nothing about ΔH alone, or about speed.'),
 A('For an exothermic reaction (ΔH < 0) at equilibrium, what happens when the temperature is raised?',
   ['The equilibrium shifts to the right and K increases', 'The equilibrium shifts to the left and K decreases', 'K stays the same but the rate falls', 'The equilibrium does not change', 'The equilibrium shifts to the right and K decreases'], 1,
   'Le Chatelier: treat heat as a product of an exothermic reaction. Adding heat pushes the equilibrium back to the left, so less product at equilibrium and a smaller K.'),
 A('What is the pH of 0.010 M HCl (a strong acid)?', ['0.01', '1', '2', '10', '12'], 2,
   'HCl ionises fully, so [H₃O⁺] = 0.010 M = 10⁻² M; pH = −log(10⁻²) = 2.'),
 A('Blood has a pH of 7.4. What is [H₃O⁺] in blood?', ['7.4 × 10⁻⁷ M', '4.0 × 10⁻⁸ M', '2.5 × 10⁻⁷ M', '1.0 × 10⁻⁷ M', '4.0 × 10⁻⁷ M'], 1,
   '[H₃O⁺] = 10⁻⁷·⁴ = 3.98 × 10⁻⁸ ≈ 4.0 × 10⁻⁸ M. Slightly less than 10⁻⁷ because blood is slightly basic.'),
 A('You need 250 mL of 50 mM NaCl made from a 2.0 M stock. What volume of stock do you use?', ['0.625 mL', '6.25 mL', '12.5 mL', '62.5 mL', '25 mL'], 1,
   'C₁V₁ = C₂V₂: V₁ = (0.050 M × 250 mL) / 2.0 M = 6.25 mL, made up to 250 mL with water.'),
 A('A reaction has ΔH > 0 and ΔS > 0. When is it spontaneous?', ['At all temperatures', 'At no temperature', 'Only at low temperatures', 'Only at high temperatures', 'Only at 25 °C'], 3,
   'ΔG = ΔH − TΔS. With both positive, ΔG becomes negative only when TΔS is bigger than ΔH, so at high T. (Endothermic, entropy-driven.)'),
 A('A weak acid has pKa = 4.8. At pH 6.8, what is the ratio [A⁻] : [HA]?', ['1 : 100', '1 : 2', '2 : 1', '100 : 1', '1 : 1'], 3,
   'pH − pKa = log([A⁻]/[HA]) = 2, so [A⁻]/[HA] = 10² = 100. Two pH units above the pKa the acid is about 99 % ionised.'),
 A('Which weak acid would make the best buffer at pH 7.2?', ['Acetic acid, pKa 4.76', 'H₂PO₄⁻, pKa 7.2', 'Tris-H⁺, pKa 8.1', 'NH₄⁺, pKa 9.25', 'HCO₃⁻, pKa 10.3'], 1,
   'A buffer works best (greatest capacity) when pH = pKa, and is useful within about ±1 pH unit of the pKa.'),
 A('In the half-reaction NAD⁺ + 2e⁻ + H⁺ → NADH, NAD⁺ is:',
   ['oxidised, and acts as a reducing agent', 'reduced, and acts as an oxidising agent', 'oxidised, and acts as an oxidising agent', 'reduced, and acts as a reducing agent', 'neither oxidised nor reduced'], 1,
   'OIL RIG: NAD⁺ gains electrons, so it is reduced. Whatever is reduced takes electrons from something else, so it is the oxidising agent.'),
 A('What is the oxidation number of sulfur in the sulfate ion, SO₄²⁻?', ['−2', '+2', '+4', '+6', '+8'], 3,
   'Each O is −2, so 4 × (−2) = −8. The ion has an overall charge of −2, so S + (−8) = −2 and S = +6.'),
 A('Two amino acids join to form a dipeptide and a molecule of water. What type of reaction is this?', ['Hydrolysis', 'Condensation', 'Redox', 'Elimination of CO₂', 'Isomerisation'], 1,
   'Joining two molecules with loss of water is a condensation reaction. The reverse, breaking the peptide bond by adding water, is hydrolysis.'),
 A('NADH has ε₃₄₀ = 6220 M⁻¹ cm⁻¹. A solution in a 1 cm cuvette has A₃₄₀ = 0.622. What is [NADH]?', ['1.0 µM', '10 µM', '100 µM', '1.0 mM', '10 mM'], 2,
   'c = A / (εl) = 0.622 / (6220 × 1) = 1.0 × 10⁻⁴ M = 100 µM.'),
 A('Light of wavelength 280 nm is compared with light of 560 nm. The 280 nm light has:',
   ['half the frequency and half the energy per photon', 'twice the frequency and twice the energy per photon', 'the same energy per photon', 'twice the frequency but half the energy per photon', 'half the frequency but twice the energy per photon'], 1,
   'ν = c / λ and E = hc / λ, so halving the wavelength doubles both the frequency and the energy of each photon.'),

 B('Consider the molecules methanol (CH₃OH), methylamine (CH₃NH₂) and ethanal (CH₃CHO).',
   text('Draw (or describe) a Lewis structure for each molecule, showing all bonds and all lone pairs.', 6, [
       P('Methanol: C bonded to 3 H and to O', r'methanol', marks=1),
       P('Methanol: O bonded to H, with 2 lone pairs on O', (r'o', r'(2|two) lone'), marks=1),
       P('Methylamine: C bonded to 3 H and to N; N bonded to 2 H', r'methylamine', marks=1),
       P('Methylamine: 1 lone pair on N', (r'n', r'(1|one|a) lone'), marks=1),
       P('Ethanal: CH₃ bonded to a C that has a C=O double bond and one H', (r'c\s*=\s*o|double'), marks=1),
       P('Ethanal: 2 lone pairs on the carbonyl O', (r'(2|two) lone', r'carbonyl|=\s*o|double'), marks=1),
   ], 'Methanol: H₃C–O–H, with two lone pairs on O. Methylamine: H₃C–NH₂, with one lone pair on N. '
      'Ethanal: H₃C–CH=O, the carbonyl O carrying two lone pairs. Every C has four bonds and no lone pairs.', lines=10),
   text('Which hydrogen atoms in these molecules can form a hydrogen bond with water? Explain.', 3, [
       P('The H on the O of methanol', r'methanol|o\s*-?\s*h', marks=1),
       P('The H atoms on the N of methylamine', r'methylamine|n\s*-?\s*h', marks=1),
       P('H atoms bonded to C cannot (C is not electronegative enough), so none of the H atoms in ethanal can', (r'c\s*-?\s*h|carbon', r'not|cannot|can\'t|no'), marks=1),
   ], 'The hydroxyl H of methanol and the two N–H hydrogens of methylamine, because they are bonded to electronegative O or N '
      'and carry a partial positive charge. H atoms bonded to carbon cannot, so ethanal has no H-bond donor H (its carbonyl O can still accept a hydrogen bond from water).', lines=5),
   text('Name the functional group in each molecule.', 3, [
       P('Methanol: hydroxyl (alcohol)', r'hydroxyl|alcohol', marks=1),
       P('Methylamine: amine (primary amine / amino)', r'amin', marks=1),
       P('Ethanal: aldehyde (carbonyl)', r'aldehyde', marks=1),
   ], 'Methanol: hydroxyl group (an alcohol). Methylamine: amino group (a primary amine). Ethanal: aldehyde (a carbonyl group at the end of the chain).', lines=3),
   num('What is the oxidation number of the carbon atom in methanol?', -2, marks=2, tol=0.01,
       working='C is bonded to 3 H (each H counts +1 to the H, so −1 to C: −3) and to 1 O (O takes the electrons: +1 to C). −3 + 1 = <b>−2</b>.')),

 B('A + B ⇌ C + D has an equilibrium constant K = 4.0 at 37 °C. A solution starts with [A] = [B] = 30 mM and no C or D.',
   num('What is [C] at equilibrium (in mM)?', 20, marks=3, tol=0.5, unit='mM',
       working='K = x² / (30 − x)² = 4, so x / (30 − x) = 2, x = 60 − 2x, 3x = 60, <b>x = 20 mM</b>.'),
   num('What is [A] at equilibrium (in mM)?', 10, marks=1, tol=0.5, unit='mM', working='30 − 20 = <b>10 mM</b>.'),
   text('Is the formation of products favoured? Explain using K.', 2, [
       P('Yes, products are favoured', r'yes|favou?r|products'),
       P('Because K > 1 (more products than reactants at equilibrium)', r'k\s*(>|is greater|greater|above|bigger|more than)\s*(than\s*)?1|k\s*>\s*1|greater than (1|one)'),
   ], 'Yes. K = 4 is greater than 1, so at equilibrium the products are present at higher concentration than the reactants.', lines=3),
   num('Calculate ΔG° for the reaction at 37 °C (in kJ mol⁻¹).', -3.57, marks=3, tol=0.06, unit='kJ mol⁻¹',
       working='T = 37 + 273.15 = 310.15 K. ΔG° = −RT ln K = −8.314 × 310.15 × ln 4 = −8.314 × 310.15 × 1.386 = −3575 J mol⁻¹ = <b>−3.57 kJ mol⁻¹</b>.'),
   num('ΔS° for the reaction is +25.0 J mol⁻¹ K⁻¹. Calculate ΔH° at 37 °C (in kJ mol⁻¹).', 4.18, marks=4, tol=0.06, unit='kJ mol⁻¹',
       working='ΔG = ΔH − TΔS, so ΔH = ΔG + TΔS = −3575 + (310.15 × 25.0) = −3575 + 7754 = 4179 J mol⁻¹ = <b>+4.18 kJ mol⁻¹</b>.'),
   text('Is the reaction endothermic or exothermic? What drives it?', 2, [
       P('Endothermic (ΔH > 0)', r'endotherm'),
       P('It is driven by the entropy increase (TΔS is larger than ΔH)', r'entrop'),
   ], 'Endothermic, because ΔH is positive. It still goes forward (ΔG < 0) because the increase in entropy (TΔS = 7.75 kJ mol⁻¹) outweighs ΔH.', lines=3)),

 B('Lactic acid is a weak acid with Ka = 1.38 × 10⁻⁴.',
   num('Calculate the pKa of lactic acid.', 3.86, marks=2, tol=0.01, working='pKa = −log(1.38 × 10⁻⁴) = <b>3.86</b>.'),
   num('A buffer contains 100 mM lactic acid and 150 mM sodium lactate. Calculate its pH.', 4.04, marks=3, tol=0.015,
       working='pH = pKa + log([A⁻]/[HA]) = 3.86 + log(150/100) = 3.86 + 0.176 = <b>4.04</b>.'),
   num('NaOH is added to this buffer to a final concentration of 20 mM (ignore the volume change). Calculate the new pH.', 4.19, marks=3, tol=0.015,
       working='OH⁻ converts HA to A⁻: [HA] = 100 − 20 = 80 mM, [A⁻] = 150 + 20 = 170 mM. pH = 3.86 + log(170/80) = 3.86 + 0.327 = <b>4.19</b>.'),
   text('Explain why the pH changed so little.', 2, [
       P('The added OH⁻ reacts with the weak acid (HA) to form A⁻ and water', r'(react|neutrali|convert|remov|consum)', r'oh|hydroxide|base'),
       P('So [H₃O⁺] barely changes: only the ratio [A⁻]/[HA] changes, and log of the ratio changes slowly', r'ratio|log|small change|little'),
   ], 'The OH⁻ is neutralised by lactic acid (HA + OH⁻ → A⁻ + H₂O) instead of staying free in solution. Only the ratio [A⁻]/[HA] changes, from 1.5 to 2.1, and the pH depends on the log of that ratio, so it rises by just 0.15.', lines=4)),

 B('Standard reduction potentials: Cu²⁺ + 2e⁻ → Cu, E° = +0.34 V; Fe²⁺ + 2e⁻ → Fe, E° = −0.44 V.',
   text('Write the balanced equation for the spontaneous reaction between these two half-cells.', 2, [
       P('Fe + Cu²⁺ on the left', (r'fe', r'cu\s*2\+|cu²⁺|cu\(ii\)')),
       P('→ Fe²⁺ + Cu on the right (1 : 1)', (r'(→|->|=|gives)', r'fe\s*2\+|fe²⁺|fe\(ii\)')),
   ], 'Fe + Cu²⁺ → Fe²⁺ + Cu. The couple with the more positive E° (Cu²⁺/Cu) is reduced; iron is oxidised.', lines=3),
   num('Calculate ΔE° for this reaction (in V).', 0.78, marks=2, tol=0.005, unit='V',
       working='ΔE° = E°(reduced, Cu) − E°(oxidised, Fe) = 0.34 − (−0.44) = <b>+0.78 V</b>.'),
   mcq('Which species is oxidised?', ['Cu²⁺', 'Cu', 'Fe', 'Fe²⁺'], 2, 'Fe loses two electrons to become Fe²⁺.', marks=1)),

 B('A protein has ε₂₈₀ = 36 000 M⁻¹ cm⁻¹.',
   num('A solution of the protein in a 1 cm cuvette has A₂₈₀ = 0.72. What is its concentration in µM?', 20, marks=2, tol=0.2, unit='µM',
       working='c = A / (εl) = 0.72 / 36 000 = 2.0 × 10⁻⁵ M = <b>20 µM</b>.'),
   num('What absorbance would the same solution give in a cuvette with a 0.2 cm path length?', 0.144, marks=2, tol=0.002,
       working='A is proportional to l: 0.72 × 0.2 = <b>0.144</b>.'),
   text('Another sample of the protein gives A₂₈₀ = 2.4. Explain how you would find its concentration accurately.', 2, [
       P('A above about 1 (to 1.5) is outside the linear range of the spectrophotometer / Beer–Lambert law', r'linear|too high|outside|range|beer'),
       P('Dilute it (e.g. 1 in 5 to A ≈ 0.48), measure, then multiply the concentration by the dilution factor', (r'dilut', r'multipl|factor|×|x\s*\d')),
   ], 'An absorbance of 2.4 is outside the linear range of the Beer–Lambert law (too little light gets through). Dilute it, for example 1 in 5 to give A ≈ 0.48, '
      'calculate the concentration of the diluted sample, then multiply by the dilution factor (5): 0.48 / 36 000 × 5 = 67 µM.', lines=4)),
]

# ====================================================================== Mock paper 2
P2 = [
 A('How many covalent bonds does an oxygen atom normally form?', ['1', '2', '3', '4', '6'], 1,
   'O has 6 valence electrons and needs 2 more for an octet, so it forms 2 bonds and keeps 2 lone pairs (as in H₂O).'),
 A('An atom has the electron configuration [Ne] 3s² 3p⁴. Which element is it?', ['Oxygen', 'Phosphorus', 'Sulfur', 'Chlorine', 'Silicon'], 2,
   '[Ne] is 10 electrons; + 2 + 4 = 16 electrons, so Z = 16: sulfur.'),
 A('Which pair of atoms is most likely to form an ionic bond?', ['C and H', 'N and H', 'Na and Cl', 'C and O', 'O and O'], 2,
   'A large electronegativity difference (Na 0.9, Cl 3.2) means electron transfer: Na⁺ and Cl⁻. The other pairs share electrons.'),
 A('Which molecule has no hydrogen that can act as a hydrogen-bond donor?', ['H₂O', 'NH₃', 'CH₃COOH', 'CH₃COCH₃ (propanone)', 'CH₃NH₂'], 3,
   'In propanone every H is bonded to C. Its C=O oxygen can accept a hydrogen bond, but it has no O–H or N–H to donate one.'),
 A('The C≡C triple bond in ethyne is made of:', ['three σ bonds', 'two σ bonds and one π bond', 'one σ bond and two π bonds', 'three π bonds', 'one σ bond and one π bond'], 2,
   'Any multiple bond has one σ bond (head-on overlap of sp orbitals here); the second and third bonds are π bonds from sideways overlap of p orbitals.'),
 A('Which functional group is found in all esters?', ['–OH', '–COOH', '–COO–R (C(=O)–O–C)', '–CHO', '–NH₂'], 2,
   'An ester is R–C(=O)–O–R′: a carbonyl carbon bonded to an O that is bonded to another carbon. It forms from an acid and an alcohol by condensation.'),
 A('Which of these species is an electrophile?', ['OH⁻', 'NH₃', 'H₂O', 'Cl⁻', 'H⁺'], 4,
   'An electrophile accepts an electron pair. H⁺ has an empty 1s orbital and no electrons at all. The others have lone pairs and are nucleophiles.'),
 A('In the reaction HCO₃⁻ + H₂O ⇌ H₂CO₃ + OH⁻, which is a conjugate acid–base pair?',
   ['HCO₃⁻ and OH⁻', 'H₂O and H₂CO₃', 'H₂CO₃ and HCO₃⁻', 'H₂O and HCO₃⁻', 'H₂CO₃ and OH⁻'], 2,
   'A conjugate pair differs by one H⁺. HCO₃⁻ gains H⁺ to become H₂CO₃ (base → conjugate acid). The other pair is H₂O / OH⁻.'),
 A('An exergonic reaction is one in which:', ['ΔH > 0', 'ΔH < 0', 'ΔG > 0', 'ΔG < 0', 'ΔS < 0'], 3,
   'Exergonic = free energy is released, ΔG < 0. Exothermic is the ΔH < 0 term: do not mix them up.'),
 A('For N₂(g) + 3H₂(g) ⇌ 2NH₃(g), what is the effect of increasing the pressure?',
   ['Equilibrium shifts left', 'Equilibrium shifts right', 'K increases', 'No effect', 'The reaction stops'], 1,
   'Higher pressure favours the side with fewer gas molecules: 4 on the left, 2 on the right, so it shifts right. K itself only changes with temperature.'),
 A('A solution has [OH⁻] = 1.0 × 10⁻⁴ M at 25 °C. What is its pH?', ['4', '7', '9', '10', '14'], 3,
   'pOH = 4, so pH = 14 − 4 = 10.'),
 A('How many times greater is [H₃O⁺] at pH 3 than at pH 6?', ['2', '3', '30', '1000', '10⁶'], 3,
   'Each pH unit is a factor of 10, so 3 units = 10³ = 1000 times.'),
 A('4.5 g of glucose (Mr = 180) is dissolved in water to make 250 mL. What is the concentration?', ['18 mM', '25 mM', '100 mM', '250 mM', '1.0 M'], 2,
   'n = 4.5 / 180 = 0.025 mol. c = 0.025 / 0.250 L = 0.10 M = 100 mM.'),
 A('A reaction has ΔH < 0 and ΔS < 0. When is it spontaneous?', ['At all temperatures', 'At no temperature', 'Only at low temperatures', 'Only at high temperatures', 'Only when K = 1'], 2,
   'ΔG = ΔH − TΔS. ΔH is negative (good) but −TΔS is positive (bad) and grows with T, so ΔG is negative only at low T.'),
 A('Ibuprofen is a weak acid with pKa 4.4. In blood (pH 7.4), ibuprofen is mostly:',
   ['un-ionised, [A⁻] : [HA] = 1 : 1000', 'ionised, [A⁻] : [HA] = 1000 : 1', 'ionised, [A⁻] : [HA] = 3 : 1', 'half ionised', 'un-ionised, [A⁻] : [HA] = 1 : 3'], 1,
   'pH − pKa = 3, so [A⁻]/[HA] = 10³. Above the pKa an acid is mostly ionised (deprotonated).'),
 A('When pH = pKa in a buffer made of a weak acid HA and its salt:',
   ['[HA] = [A⁻] and the buffering capacity is greatest', '[HA] = 10 × [A⁻]', 'the buffer has no capacity', '[A⁻] = 10 × [HA]', 'all the acid is ionised'], 0,
   'log([A⁻]/[HA]) = 0, so the ratio is 1. With equal amounts of HA and A⁻ the buffer can neutralise added acid and added base equally well.'),
 A('Using these E°′ values, which is the strongest reducing agent? NAD⁺/NADH −0.32 V; FAD/FADH₂ −0.22 V; Q/QH₂ +0.04 V; cyt c Fe³⁺/Fe²⁺ +0.25 V; O₂/H₂O +0.82 V',
   ['NADH', 'FADH₂', 'QH₂', 'cyt c (Fe²⁺)', 'H₂O'], 0,
   'The reduced form of the couple with the most negative E°′ gives up electrons most readily, so NADH is the strongest reductant. O₂ is the strongest oxidant.'),
 A('Ca(OH)₂ + __ HCl → CaCl₂ + __ H₂O. Which coefficients balance the equation?', ['1 and 1', '1 and 2', '2 and 1', '2 and 2', '2 and 3'], 3,
   'Two Cl on the right need 2 HCl. Then 2 OH⁻ + 2 H⁺ make 2 H₂O. Check: Ca 1, O 2, H 4, Cl 2 on both sides.'),
 A('An ester is broken into a carboxylic acid and an alcohol by adding water. This is:', ['condensation', 'hydrolysis', 'oxidation', 'reduction', 'dehydration'], 1,
   'Hydro-lysis = splitting with water. It is the reverse of the condensation (esterification) that made the ester.'),
 A('What is the energy of one photon of light with wavelength 260 nm? (h = 6.626 × 10⁻³⁴ J s, c = 3.00 × 10⁸ m s⁻¹)',
   ['7.65 × 10⁻²⁸ J', '7.65 × 10⁻¹⁹ J', '1.15 × 10¹⁵ J', '5.17 × 10⁻¹⁹ J', '2.60 × 10⁻⁷ J'], 1,
   'E = hc / λ = (6.626 × 10⁻³⁴ × 3.00 × 10⁸) / (260 × 10⁻⁹) = 7.65 × 10⁻¹⁹ J. Remember to convert nm to m.'),

 B('Consider ethanoic acid (CH₃COOH), ammonia (NH₃) and methanal (HCHO).',
   text('Draw (or describe) a Lewis structure for each molecule, showing all bonds and all lone pairs.', 6, [
       P('Ethanoic acid: CH₃ bonded to a C with C=O and C–O–H', r'ethanoic|acetic'),
       P('Ethanoic acid: 2 lone pairs on each O', (r'(2|two) lone', r'each|both')),
       P('Ammonia: N bonded to 3 H', r'ammonia|nh3|nh₃'),
       P('Ammonia: 1 lone pair on N', r'(1|one|a) lone'),
       P('Methanal: C bonded to 2 H with C=O', r'methanal|formaldehyde|h2c\s*=\s*o|h₂c\s*=\s*o'),
       P('Methanal: 2 lone pairs on O', (r'methanal|formaldehyde', r'(2|two) lone')),
   ], 'Ethanoic acid: H₃C–C(=O)–O–H; the carbonyl O and the hydroxyl O each have two lone pairs. Ammonia: N with three N–H bonds and one lone pair. '
      'Methanal: H₂C=O, the O carrying two lone pairs.', lines=10),
   text('Give the shape and approximate H–N–H bond angle of ammonia, and explain the angle.', 2, [
       P('Trigonal pyramidal, about 107°', (r'pyramid', r'10[67]')),
       P('Less than 109.5° because the lone pair repels the bonding pairs more strongly', r'lone pair'),
   ], 'Trigonal pyramidal, about 107°. The four electron pairs are arranged roughly tetrahedrally, but the lone pair repels more strongly than bonding pairs and squeezes the N–H bonds together.', lines=3),
   text('Name the functional group in ethanoic acid and in methanal.', 2, [
       P('Ethanoic acid: carboxylic acid (carboxyl)', r'carboxy'),
       P('Methanal: aldehyde (carbonyl)', r'aldehyde'),
   ], 'Ethanoic acid: carboxylic acid (–COOH). Methanal: aldehyde (–CHO).', lines=2),
   text('Which hydrogen in ethanoic acid can form a hydrogen bond with water? Describe the hydrogen bond.', 2, [
       P('The H of the –OH (carboxyl) group only', r'o\s*-?\s*h|hydroxyl|carboxyl|acid h'),
       P('It is attracted to a lone pair on the O of a water molecule (δ+ H … δ− O)', (r'lone pair|δ|delta|partial', r'water|o')),
   ], 'Only the H of the –OH group, which carries a δ+ charge because it is bonded to the electronegative O. It is attracted to a lone pair on the δ− oxygen of water: O–H⋯OH₂.', lines=4),
   num('What is the oxidation number of carbon in methanal (HCHO)?', 0, marks=2, tol=0.01,
       working='2 H give C −2; the double bond to O gives C +2. Total <b>0</b>.')),

 B('Phosphoglucomutase catalyses glucose-1-phosphate (G1P) ⇌ glucose-6-phosphate (G6P). At 25 °C, K = 19.',
   num('A solution starts with 100 mM G1P and no G6P. What is [G6P] at equilibrium (in mM)?', 95, marks=3, tol=0.5, unit='mM',
       working='K = x / (100 − x) = 19, so x = 1900 − 19x, 20x = 1900, <b>x = 95 mM</b> (and [G1P] = 5 mM).'),
   num('Calculate ΔG° at 25 °C (in kJ mol⁻¹).', -7.30, marks=3, tol=0.06, unit='kJ mol⁻¹',
       working='T = 298.15 K. ΔG° = −RT ln K = −8.314 × 298.15 × ln 19 = −2479 × 2.944 = −7299 J mol⁻¹ = <b>−7.30 kJ mol⁻¹</b>.'),
   num('In a cell, [G1P] = 50 mM and [G6P] = 10 mM. Calculate ΔG for the reaction under these conditions (in kJ mol⁻¹).', -11.3, marks=4, tol=0.15, unit='kJ mol⁻¹',
       working='Q = [G6P]/[G1P] = 10/50 = 0.2. ΔG = ΔG° + RT ln Q = −7299 + 2479 × ln 0.2 = −7299 + 2479 × (−1.609) = −7299 − 3990 = −11 289 J mol⁻¹ = <b>−11.3 kJ mol⁻¹</b>.'),
   mcq('Under these cellular conditions, in which direction does the reaction go?', ['G1P → G6P (forward)', 'G6P → G1P (backward)', 'It is at equilibrium'], 0,
       'ΔG is negative, so the forward reaction is spontaneous. Q (0.2) is far below K (19).', marks=1),
   num('ΔH° for the reaction is −1.8 kJ mol⁻¹. Calculate ΔS° (in J mol⁻¹ K⁻¹).', 18.4, marks=3, tol=0.3, unit='J mol⁻¹ K⁻¹',
       working='ΔG = ΔH − TΔS, so ΔS = (ΔH − ΔG)/T = (−1800 − (−7299)) / 298.15 = 5499 / 298.15 = <b>+18.4 J mol⁻¹ K⁻¹</b>.'),
   mcq('Does the entropy of the system increase or decrease in the forward reaction?', ['Increase', 'Decrease', 'No change'], 0, 'ΔS° is positive.', marks=1)),

 B('The dihydrogen phosphate ion H₂PO₄⁻ is a weak acid with Ka = 6.2 × 10⁻⁸.',
   num('Calculate its pKa.', 7.21, marks=2, tol=0.01, working='pKa = −log(6.2 × 10⁻⁸) = <b>7.21</b>.'),
   num('A buffer contains 50 mM NaH₂PO₄ and 80 mM Na₂HPO₄. Calculate its pH.', 7.41, marks=3, tol=0.015,
       working='pH = 7.21 + log(80/50) = 7.21 + 0.204 = <b>7.41</b>.'),
   num('HCl is added to this buffer to a final concentration of 10 mM (ignore the volume change). Calculate the new pH.', 7.28, marks=3, tol=0.015,
       working='H⁺ converts HPO₄²⁻ to H₂PO₄⁻: [A⁻] = 80 − 10 = 70 mM, [HA] = 50 + 10 = 60 mM. pH = 7.21 + log(70/60) = 7.21 + 0.067 = <b>7.28</b>.'),
   text('Explain why phosphate is a good buffer inside cells.', 2, [
       P('Its pKa (7.2) is close to the pH inside cells (about 7.2 to 7.4)', (r'pka', r'7|close|near|physiolog|cell')),
       P('Buffers work best within about 1 unit of pKa, where both HA and A⁻ are present in useful amounts', r'(±|\+/-|within|1 unit|one unit|both|equal|similar)'),
   ], 'Its pKa of 7.2 is close to intracellular pH (about 7.2), and a buffer works best within about ±1 pH unit of its pKa, '
      'where there are useful amounts of both H₂PO₄⁻ (to neutralise base) and HPO₄²⁻ (to neutralise acid). Phosphate is also present at high concentration in cells.', lines=4)),

 B('In the respiratory chain, electrons pass from NADH to O₂. E°′(NAD⁺/NADH) = −0.32 V; E°′(½O₂/H₂O) = +0.82 V.',
   text('Write a balanced equation for the oxidation of NADH by oxygen.', 2, [
       P('NADH + H⁺ + ½O₂ (or 2NADH + 2H⁺ + O₂) on the left', (r'nadh', r'o2|o₂')),
       P('→ NAD⁺ + H₂O (balanced)', (r'nad\+|nad⁺', r'h2o|h₂o')),
   ], 'NADH + H⁺ + ½O₂ → NAD⁺ + H₂O (or 2NADH + 2H⁺ + O₂ → 2NAD⁺ + 2H₂O).', lines=3),
   num('Calculate ΔE°′ (in V).', 1.14, marks=2, tol=0.005, unit='V',
       working='ΔE°′ = E°′(acceptor) − E°′(donor) = 0.82 − (−0.32) = <b>+1.14 V</b>.'),
   num('Calculate ΔG°′ per mole of NADH (n = 2) in kJ mol⁻¹.', -220, marks=1, tol=1.5, unit='kJ mol⁻¹',
       working='ΔG°′ = −nFΔE°′ = −2 × 96 485 × 1.14 = −219 986 J mol⁻¹ = <b>−220 kJ mol⁻¹</b>.')),

 B('An enzyme assay follows NADH by its absorbance at 340 nm (ε₃₄₀ = 6220 M⁻¹ cm⁻¹, 1 cm cuvette).',
   num('At the start, A₃₄₀ = 0.311. What is [NADH] in µM?', 50, marks=2, tol=0.5, unit='µM',
       working='c = A / (εl) = 0.311 / 6220 = 5.0 × 10⁻⁵ M = <b>50 µM</b>.'),
   num('After 2.0 minutes A₃₄₀ has fallen to 0.187. What is the rate of NADH use in µM min⁻¹?', 10, marks=2, tol=0.2, unit='µM min⁻¹',
       working='ΔA = 0.311 − 0.187 = 0.124. Δc = 0.124 / 6220 = 1.99 × 10⁻⁵ M = 19.9 µM over 2.0 min = <b>10 µM min⁻¹</b>.'),
   text('Why is the assay measured at 340 nm rather than at 260 nm?', 2, [
       P('At 340 nm only NADH absorbs (NAD⁺ does not)', (r'nadh', r'only|not|doesn|does not')),
       P('Both NAD⁺ and NADH absorb at 260 nm (adenine ring), so the change could not be followed there', r'260|both|adenine'),
   ], 'Both NAD⁺ and NADH absorb strongly at 260 nm (the adenine ring), so the conversion would hardly change the absorbance. '
      'At 340 nm only NADH absorbs (its reduced nicotinamide ring), so A₃₄₀ falls in proportion to the NADH used.', lines=4)),
]

PAPERS = [
    ('chem-mock-1', 'Mock exam 1', P1),
    ('chem-mock-2', 'Mock exam 2', P2),
]


def build():
    papers = []
    for pid, title, qs in PAPERS:
        for i, q in enumerate(qs):
            q['id'] = f'{pid}-q{i + 1}'
            for j, p in enumerate(q['parts']):
                p['id'] = f'{pid}-q{i + 1}{"abcdefghijkl"[j]}'
        total = sum(p['marks'] for q in qs for p in q['parts'])
        a = sum(1 for q in qs if q['section'] == 'A')
        b = [sum(p['marks'] for p in q['parts']) for q in qs if q['section'] == 'B']
        assert a == 20 and total == 100 and b == [14, 15, 10, 5, 6], (pid, a, total, b)
        papers.append({'id': pid, 'title': title, 'lecture': 'Block 1 mock', 'hub': HUB, 'marks': total, 'note': NOTE,
                       'printable': True, 'duration': '2 hours', 'code': 'BIO-4017Y', 'equations': EQUATIONS, 'questions': qs})
    out = {'subject': 'Biological Chemistry', 'module': 'BIO-4017Y', 'keep_questions': True, 'papers': papers}
    json.dump(out, open(os.path.join(HERE, 'biological-chemistry.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for p in papers:
        print(p['id'], p['title'], len(p['questions']), 'questions', p['marks'], 'marks')


if __name__ == '__main__':
    build()
