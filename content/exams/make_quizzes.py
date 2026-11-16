"""Practice quizzes Alex found online (point-scored multiple-choice tests). Exam practice only, not flashcards.
Writes content/exams/online-quizzes.json; tools/curate.py turns it into its own 'Online quizzes' section."""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def mcq(stem, options, answer, explain):
    return {'type': 'mcq', 'stem': '', 'options': options, 'answer': answer, 'explain': explain, 'marks': 1, '_q': stem}


def num(stem, value, explain, tol=None, unit=''):
    d = {'type': 'num', 'stem': '', 'value': value, 'marks': 1, 'unit': unit, 'working': explain, '_q': stem}
    if tol is not None:
        d['tol'] = tol
    return d


TF = ['True', 'False']

chem = [
    mcq('Which of the following statements is true about a reaction that has an equilibrium constant K &lt; 1?',
        ['At equilibrium there are equal amounts of products and reactants', 'At equilibrium there are more products than reactants',
         'All reactants have been converted to products', 'At equilibrium there are more reactants than products'], 3,
        'K = [products] ÷ [reactants]. If K is less than 1, the bottom is bigger, so there are more reactants than products at equilibrium.'),
    mcq('For a non-spontaneous reaction (complete the sentence)…',
        ['(TΔS − ΔH) must be positive', 'ΔS must be negative', 'ΔH must be negative', 'ΔH must be positive', '(ΔH − TΔS) must be positive'], 4,
        'ΔG = ΔH − TΔS, and non-spontaneous means ΔG &gt; 0, so (ΔH − TΔS) is positive. (TΔS − ΔH) positive would mean ΔG is negative. ΔH or ΔS alone can\'t decide it.'),
    mcq('For a reversible reaction, which of the following statements is true?',
        ['If ΔG &gt; 0 the forward reaction is spontaneous', 'If ΔG = 0 the forward reaction is spontaneous', 'If ΔG &gt; 0 the reverse reaction is spontaneous',
         'If ΔG &lt; 0 the reverse reaction is spontaneous', 'If ΔG = 0 the reverse reaction is spontaneous'], 2,
        'ΔG &gt; 0 means the forward reaction is not spontaneous, so the reverse one is. ΔG = 0 is equilibrium: neither direction.'),
    mcq('For the reaction A + B ⇌ C + heat at equilibrium, decreasing the temperature will favour the ___ reaction.', ['forward', 'back'], 0,
        'Heat is a product, so the forward reaction is exothermic. Cooling favours the direction that releases heat.'),
    mcq('Which one of the following is NOT associated with an increase in entropy?',
        ['A reaction that releases heat into the environment', 'The melting of ice to yield liquid water', 'The breakdown of glycogen into its glucose subunits',
         'The folding of a polypeptide chain into a more compact three-dimensional shape', 'The evaporation of sweat from the surface of the skin'], 3,
        'Folding into a compact shape makes the chain more ordered, so its entropy falls. The others all increase disorder (released heat raises the surroundings\' entropy).'),
    mcq("True or false: 'Bond formation (in chemical reactions) generates energy.'", TF, 0, 'Forming bonds releases energy; breaking bonds takes energy in.'),
    mcq('A protein folds with ΔH° = −20.4 kJ mol⁻¹ and ΔS° = −302.2 J mol⁻¹ K⁻¹. At 37 °C, which is true?',
        ['The reaction is endergonic and therefore not spontaneous', 'The reaction is exergonic and therefore spontaneous', 'The reaction is exergonic and therefore not spontaneous',
         'The spontaneity is impossible to tell from the information', 'The reaction is not spontaneous because it is endothermic'], 0,
        'T = 310 K and ΔS = −0.3022 kJ mol⁻¹ K⁻¹. ΔG = ΔH − TΔS = −20.4 − (310 × −0.3022) = −20.4 + 93.7 = +73.3 kJ mol⁻¹. Positive, so endergonic and not spontaneous.'),
    mcq('True or false: a closed system can only exchange energy with its environment.', TF, 0,
        'Closed: energy but not matter. Open: both. Isolated: neither.'),
    num('C₄H₁₀O → C₄H₈ + H₂O. ΔHf: C₄H₁₀O −335, C₄H₈ −17, H₂O −242 kJ mol⁻¹. What is the enthalpy change of the reaction (kJ mol⁻¹)?', 76,
        'Hess cycle with the elements at the bottom. Reactants → elements is against the arrow: +335. Elements → products: −17 + (−242) = −259. ΔH = +335 − 259 = +76 kJ mol⁻¹.', tol=0.5, unit='kJ mol⁻¹'),
    mcq("True or false: 'Bond formation (in chemical reactions) requires input of energy.'", TF, 1, 'False: bond breaking needs energy; bond formation releases it.'),
    num('A + B ⇌ 2C at 35 °C. At equilibrium [A] = 0.5 M, [B] = 0.5 M, [C] = 0.1 M. Calculate ΔG° in kJ mol⁻¹ (3 s.f.).', 8.25,
        'K = [C]² ÷ ([A][B]) = 0.01 ÷ 0.25 = 0.04. T = 308 K. ΔG° = −RT ln K = −8.315 × 308 × ln 0.04 = +8.24 to 8.25 kJ mol⁻¹ (8.25 with 273.15). Either is accepted here.', tol=0.015, unit='kJ mol⁻¹'),
    mcq('A reaction in a glass flask makes the flask colder to the touch. What would you call it?', ['exothermic', 'endothermic', 'none of the above', 'exergonic', 'endergonic'], 1,
        'The flask cools because the reaction takes heat in from its surroundings: endothermic.'),
    num('2A + B ⇌ C. At equilibrium [A] = 0.1 M, [B] = 0.2 M, [C] = 0.1 M. What is K (no units)?', 50,
        'K = [C] ÷ ([A]² [B]) = 0.1 ÷ (0.01 × 0.2) = 0.1 ÷ 0.002 = 50.', tol=0.01),
    mcq('Which of the following terms describes a spontaneous reaction?', ['endothermic', 'exothermic', 'exergonic', 'endergonic', 'exotropic'], 2,
        'Spontaneous means ΔG &lt; 0: exergonic. Exothermic alone doesn\'t guarantee it.'),
]

gen = [
    mcq('The haploid human genome is about 670 times larger than the <em>E. coli</em> genome. This size difference is mostly because of which of the following?',
        ['In E. coli each codon is made up of only two nucleotides', 'The human genome has much more repetitive DNA than E. coli',
         'Human genes are on average 670 times larger than E. coli genes', 'The haploid human genome contains ~670 times more unique genes than the E. coli genome', 'Humans are diploid'], 1,
        'Most of the human genome is non-coding and repetitive. E. coli is almost all genes.'),
    mcq('Dihybrid cross: LeLe II × lele ii. In the F2, what is the probability of genotype Lele Ii?', ['0.5', '0.0625', '0.25', '0.125', '0.75'], 2,
        'One gene at a time: Le/le × Le/le gives Lele ½; I/i × I/i gives Ii ½. ½ × ½ = 0.25.'),
    mcq('A diploid organism has a haploid set of 7 chromosomes. How many unique combinations of maternal and paternal chromosomes can independent assortment alone produce in gametes?',
        ['256', '7', '128', '64', '8'], 2, 'Each pair can line up 2 ways: 2⁷ = 128.'),
    mcq('The haploid number in humans is 23. How many chromosomes are in the somatic cells of a trisomic human?', ['45', '47', '46', '22', '23'], 1,
        'Normal 2n = 46; trisomy adds one: 47.'),
    mcq('F2 fruit flies: P(red eyes) = 0.75 and P(long wings) = 0.75, genes assort independently. What is the probability of red eyes and short wings?',
        ['1.0', '0.0625', '0.1875', '2.25', '0.5625'], 2, 'Red ¾ × short (¼) = 3/16 = 0.1875.'),
    mcq('When inserted into a coding sequence, which number of nucleotides is likely to have the least effect on the protein?', ['1', '2', '5', '4', '3'], 4,
        '3 nucleotides add one codon and keep the reading frame. Any other number causes a frameshift.'),
    mcq('House flies have a haploid number of 6. How many chromosomes are in a diploid house fly cell?', ['6', '0', '12', '9', '3'], 2, '2n = 2 × 6 = 12.'),
    mcq('In a cross of pea plants (Punnett square in the original quiz, assumed Rr × Rr), 2000 progeny are heterozygous. About how many progeny have round seed?',
        ['1000', '0', '2000', '3000', '4000'], 3,
        'Assuming Rr × Rr: heterozygotes are ½, so 2000 means 4000 in total. Round (dominant) is ¾ of 4000 = 3000. The original Punnett square image wasn\'t included, so check it if you have it.'),
    mcq('Tall yellow × dwarf green peas; all F1 tall yellow. Of 3200 F2 progeny, about how many are dwarf with green seed?', ['600', '800', '200', '1800', '3200'], 2,
        'Double recessive is 1/16 of the F2: 3200 ÷ 16 = 200.'),
    mcq('A diploid silk worm cell (2n = 56) undergoes mitosis. How many chromosomes does each daughter cell contain?', ['14', '28', '112', '56', '224'], 3,
        'Mitosis keeps the chromosome number: 56.'),
    mcq('1 = allelic segregation, 2 = pairing of homologous bivalents, 3 = separation of sister chromatids. In meiosis, which is the correct order?',
        ['2 then 1 then 3', '1 then 2 then 3', '1 then 3 then 2', '2 then 3 then 1', '3 then 1 then 2'], 0,
        'Homologues pair in prophase I, alleles separate in anaphase I, sister chromatids separate in anaphase II.'),
    mcq('Rarely, tortoiseshell cats can be male. What sex-chromosome genotype are they likely to have?', ['XO', 'XY', 'XX', 'XXX', 'XXY'], 4,
        'Tortoiseshell needs two X chromosomes (two coat-colour alleles), and male needs a Y: XXY.'),
    mcq('How many Barr bodies would be expected in each cell of a mammal with three X chromosomes?', ['2', '4', '3', '1', '0'], 0,
        'Barr bodies = number of X chromosomes − 1 = 2.'),
    mcq('A diploid silk worm cell (2n = 56) undergoes meiosis. How many chromosomes does each daughter cell contain?', ['56', '28', '112', '224', '14'], 1,
        'Meiosis halves the number: 28.'),
    mcq('A diploid human cell (2n = 46) undergoes meiosis. How many chromosomes does each gamete contain?', ['92', '184', '23', '46', '1'], 2,
        'Meiosis halves it: 23.'),
    mcq('Trihybrid cross: AA BB CC × aa bb cc, genes assort independently. What is the probability that an F2 individual is AA Bb Cc?', ['0.125', '0.0625', '0.5', '0.75', '0.25'], 1,
        'AA ¼ × Bb ½ × Cc ½ = 1/16 = 0.0625.'),
    mcq('A single human female germline cell undergoes meiosis. How many gametes (ova) are produced?', ['2', '5', '3', '1', '4'], 3,
        'One ovum; the other products become polar bodies, which aren\'t gametes.'),
    mcq('A single human male germline cell undergoes meiosis. How many gametes (spermatozoa) are produced?', ['8', '2', '3', '4', '1'], 3,
        'All four products of male meiosis become sperm.'),
    mcq('Tall round × dwarf wrinkled peas; all F1 tall round. Of 1600 F2 progeny, about how many are tall with wrinkled seed?', ['400', '300', '100', '900', '1600'], 1,
        'Tall wrinkled is 3/16 of the F2: 1600 × 3/16 = 300.'),
    mcq('F2 fruit flies: P(red eyes) = 0.75 and P(long wings) = 0.75, genes assort independently. What is the probability of white eyes and short wings?',
        ['1.0', '0.0625', '0.25', '0.125', '0.5'], 1, 'White ¼ × short ¼ = 1/16 = 0.0625.'),
]


def paper(pid, title, lecture, parts):
    qs = []
    for i, p in enumerate(parts):
        stem = p.pop('_q')
        p['id'] = f'{pid}-q{i + 1}a'
        qs.append({'stem': stem, 'parts': [p], 'id': f'{pid}-q{i + 1}'})
    return {'id': pid, 'title': title, 'lecture': lecture, 'hub': '', 'marks': len(parts), 'questions': qs}


out = {'subject': 'Online quizzes', 'module': 'Point-scored practice quizzes found online',
       'papers': [paper('oq-chem-1', 'Thermodynamics and equilibrium quiz', 'Biological Chemistry', chem),
                  paper('oq-gen-1', 'Genetics quiz: Mendel, meiosis and chromosomes', 'Molecular Biology and Genetics', gen)]}
json.dump(out, open(os.path.join(HERE, 'online-quizzes.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('papers', len(out['papers']), [len(p['questions']) for p in out['papers']])
