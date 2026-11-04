"""Exam practice papers for Molecular Biology and Genetics (BIO-4018A).

Writes molecular-biology-and-genetics.json next to this file. Run:  python3 content/exams/make_genetics.py

Part types
  mcq    options + answer index
  text   free text, marked against scheme points: each point has 'kw', a list of alternatives;
         an alternative is a list of regexes that must ALL appear (case-insensitive)
  num    a number, within tol (absolute) or rtol (relative); 'unit' shown next to the box
  seq    a sequence; spaces, dashes, 5'/3' labels removed before comparing with 'accept'
         ('half' gives part marks for a common slip); mode 'aa' compares amino acid lists
  label  blanks over a figure: each label has a box (% of the image) and accepted regexes
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
A = 'attachments/04 Attachments/'
OCC = {}
_occ = os.path.join(HERE, 'occl_boxes.json')
if os.path.exists(_occ):
    OCC = json.load(open(_occ, encoding='utf-8'))


def P(text, *alts, marks=1):
    """A marking point. Each alt is a regex string or a list of regex strings (all must match)."""
    return {'text': text, 'marks': marks, 'kw': [[a] if isinstance(a, str) else list(a) for a in alts]}


def mcq(stem, options, answer, explain='', marks=1):
    return {'type': 'mcq', 'stem': stem, 'options': options, 'answer': answer, 'explain': explain, 'marks': marks}


def text(stem, marks, scheme, model, lines=4):
    return {'type': 'text', 'stem': stem, 'marks': marks, 'scheme': scheme, 'model': model, 'lines': lines}


def num(stem, value, marks=1, tol=None, rtol=None, unit='', working=''):
    d = {'type': 'num', 'stem': stem, 'value': value, 'marks': marks, 'unit': unit, 'working': working}
    if tol is not None:
        d['tol'] = tol
    if rtol is not None:
        d['rtol'] = rtol
    return d


def seq(stem, accept, marks=1, half=(), mode='nt', model='', note=''):
    return {'type': 'seq', 'stem': stem, 'accept': list(accept), 'half': list(half), 'marks': marks, 'mode': mode, 'model': model or accept[0], 'note': note}


def label(stem, img, picks):
    """picks: list of (answer prefix in the diagram cards, [accepted regexes], shown answer)"""
    boxes = OCC[img]
    labels = []
    for pref, acc, shown in picks:
        b = next(x for x in boxes if x['a'].startswith(pref))
        labels.append({'box': b['b'], 'accept': acc, 'answer': shown})
    return {'type': 'label', 'stem': stem, 'img': A + img, 'labels': labels, 'marks': len(labels)}


def Q(stem, *parts, img=None, table=None, ref=None):
    q = {'stem': stem, 'parts': list(parts)}
    if img:
        q['img'] = img
    if table:
        q['table'] = table
    if ref:
        q['ref'] = ref
    return q


L = {}

# ------------------------------------------------------------------ Lecture 1
L['l1'] = ('Heredity and DNA', 'Lecture 1', '01 Year 1/Molecular Biology and Genetics/Lectures/01 Heredity and DNA/Heredity and DNA', [
 Q('Griffith injected mice with different preparations of <em>Streptococcus pneumoniae</em>.',
   mcq('Which injection killed the mouse <strong>and</strong> gave living type IIIS bacteria in its tissue?',
       ['Live IIR alone', 'Heat-killed IIIS alone', 'Live IIR mixed with heat-killed IIIS', 'Heat-killed IIR mixed with heat-killed IIIS'], 2,
       'Something from the dead virulent IIIS cells transformed the living harmless IIR cells into virulent IIIS: the transforming principle.')),
 Q('Avery, MacLeod and McCarty set out to identify Griffith\'s transforming principle.',
   text('Describe their experiment and explain how it showed that the transforming principle is DNA.', 4, [
     P('IIIS extract or filtrate split into batches, each treated with a different enzyme', [r'filtrate|extract|batch', r'enzyme|dnase|rnase|protease|nuclease']),
     P('DNase-treated extract did not transform IIR cells', [r'dnase|deoxyribonuclease', r'no transform|not transform|did ?n.t transform|fail|stop|abolish|prevent|no longer']),
     P('RNase- and protease-treated extracts still transformed', [r'rnase|ribonuclease|protease', r'still|occur|did transform|transformation (still )?happen|continued|not stop|no effect|did not prevent|didn.t stop|unaffected']),
     P('So, by elimination, DNA is the transforming principle', [r'\bdna\b', r'transforming principle|active (factor|agent)|genetic material|eliminat|responsible'])],
     'The IIIS extract was split into batches treated with DNase, RNase or protease, then each was mixed with live IIR cells. Only the DNase-treated batch failed to transform; RNase and protease treatment did not stop transformation. Destroying DNA alone abolished transformation, so DNA is the transforming principle.', 5)),
 Q('Hershey and Chase grew T2 bacteriophage with ³²P or with ³⁵S, infected unlabelled <em>E. coli</em>, blended the cultures and centrifuged them.',
   text('Explain why ³²P and ³⁵S were chosen.', 2, [
     P('³²P labels DNA because DNA contains phosphorus (in its backbone) and protein does not', [r'32|phosph', r'\bdna\b']),
     P('³⁵S labels protein because protein contains sulfur (cysteine, methionine) and DNA does not', [r'35|sul(ph|f)', r'protein'])],
     'DNA contains phosphorus but no sulfur, so ³²P labels only DNA. Protein contains sulfur (in cysteine and methionine) but no phosphorus, so ³⁵S labels only protein.', 3),
   text('Where was each isotope found after centrifugation?', 2, [
     P('³²P in the pellet, inside the bacteria', [r'32|phosph', r'pellet|inside|bacteri|cells']),
     P('³⁵S in the supernatant, with the empty phage coats outside the cells', [r'35|sul(ph|f)', r'supernatant|outside|coat|ghost'])],
     '³²P (DNA) was in the pellet, inside the bacteria. ³⁵S (protein) stayed in the supernatant with the empty phage coats.', 2),
   text('What did they conclude?', 1, [P('DNA (not protein) enters the cell, so DNA is the genetic material', [r'\bdna\b', r'enter|genetic material|hereditary|inject|carries'])],
        'DNA, not protein, enters the bacterium and directs new phage, so DNA is the genetic material.', 2)),
 Q('Mendel crossed tall (<em>LeLe</em>) and dwarf (<em>lele</em>) peas. The F1 were all tall. Self-fertilising the F1 gave 787 tall and 277 dwarf F2 plants.',
   num('Calculate the F2 ratio of tall to dwarf, as <em>x</em> : 1 (to 2 decimal places).', 2.84, marks=1, tol=0.02, working='787 ÷ 277 = 2.84, so 2.84 : 1, close to 3 : 1.'),
   text('Explain the 3 : 1 ratio in terms of alleles and meiosis.', 3, [
     P('F1 plants are heterozygous, Lele', r'lele|heterozyg'),
     P('The alleles segregate during meiosis, so half the gametes carry Le and half carry le', [r'segregat|separat|meiosis|gamete', r'half|50|½|1 ?: ?1|equal']),
     P('Random fertilisation gives 1 LeLe : 2 Lele : 1 lele; Le is dominant so 3 tall : 1 dwarf', [r'1 ?: ?2 ?: ?1|lele.*lele.*lele|dominan', r'tall|3 ?: ?1'])],
     'The F1 are all Lele. During meiosis the two alleles segregate, so each F1 plant makes Le and le gametes in equal numbers. Random fertilisation gives 1 LeLe : 2 Lele : 1 lele. Le is dominant, so three quarters are tall and one quarter dwarf: 3 : 1.', 4)),
 Q('The diagram shows an <em>Agrobacterium tumefaciens</em> cell.',
   label('Name the labelled structures.', 'tiplasmid.jpg', [
     ('Ti-plasmid', [r'ti[- ]?plasmid|tumou?r[- ]inducing'], 'Ti plasmid'), ('T-DNA', [r't[- ]?dna|transfer(red)? dna'], 'T-DNA'),
     ('vir genes', [r'\bvir|virulence'], 'vir genes'), ('bacterial chromosome', [r'chromosom'], 'bacterial chromosome')]),
   text('Explain how <em>Agrobacterium</em> causes crown gall disease.', 2, [
     P('The T-DNA from the Ti plasmid is transferred into the plant cell and inserted into its genome', [r't[- ]?dna', r'transfer|insert|integrat|plant genome|plant cell']),
     P('It reprograms the plant cells to grow and divide, forming a tumour (gall)', r'gall|tumou?r|divid|prolifer|grow')],
     'Its vir genes transfer the T-DNA segment of the Ti plasmid into the plant cell, where it inserts into the plant genome and makes the cells proliferate into a tumour, the crown gall.', 3)),
 Q('In the lab, <em>E. coli</em> can be made competent and transformed with a plasmid.',
   text('Explain the roles of calcium chloride and the heat shock.', 3, [
     P('Ca²⁺ ions neutralise the negative charges on the membrane and on the DNA phosphate backbone', [r'cacl|calcium|ca2|ca²|cation|positive', r'neutrali|negative|charge|repuls']),
     P('This reduces repulsion so DNA can approach and bind the cell surface', r'repuls|approach|bind|close|stick'),
     P('A brief heat shock (42 °C) helps the plasmid cross into the cell', [r'heat ?shock|42', r'enter|cross|into the cell|uptake|take up|pores|permeab'])],
     'Calcium ions neutralise the negative charges on the cell membrane and on DNA\'s phosphate backbone, reducing repulsion so the DNA can approach the cell. A brief heat shock at 42 °C then helps the plasmid cross the membrane into the cell.', 4)),
 Q('Double-stranded DNA is heated slowly while its absorbance at 260 nm is measured.',
   mcq('Why do nucleic acids absorb UV light most strongly at 260 nm?', ['The phosphate groups', 'The deoxyribose sugars', 'The bases', 'The hydrogen bonds'], 2,
       'Absorption at 260 nm comes from the bases.'),
   text('Describe and explain what happens to the absorbance as the DNA melts, and how GC content affects the melting temperature (Tm).', 4, [
     P('Absorbance at 260 nm increases as the DNA denatures (hyperchromic effect)', [r'increas|rise|goes up|higher', r'absorb|a260|hyperchrom']),
     P('Because single-stranded, unstacked bases absorb more UV than stacked bases in the double helix', r'unstack|stack|single[- ]strand'),
     P('Tm is the temperature at which half of the DNA is denatured', [r'half|50', r'denatur|single|melt|separat']),
     P('More G–C raises Tm, because G–C pairs have three hydrogen bonds and A–T pairs two', [r'gc|g.c|guanine', r'three|3 h|3 hydrogen|more hydrogen|stronger|higher'])],
     'As the strands separate, absorbance at 260 nm rises (the hyperchromic effect), because unstacked single-stranded bases absorb more UV than bases stacked in the helix. Tm is the temperature at which half the DNA is denatured. DNA richer in G–C has a higher Tm, because each G–C pair has three hydrogen bonds against two for A–T.', 5)),
 Q('The pea <em>Le</em> gene encodes gibberellin 3β-hydroxylase.',
   text('Explain how a single change in the DNA makes <em>le</em> plants dwarf.', 3, [
     P('An A→G substitution changes one amino acid (Ala229→Thr, A229T)', r'a ?(→|->|to) ?g|229|a229t|ala.*thr|substitut|one amino acid'),
     P('The enzyme (gibberellin 3β-hydroxylase) barely works', r'enzyme|hydroxylase|activity|function'),
     P('So little active gibberellin (GA1) is made, so less stem growth', r'gibberellin|ga ?1|hormone|stem|elongat|growth')],
     'An A→G change swaps alanine 229 for threonine. The altered gibberellin 3β-hydroxylase has very little activity, so little active gibberellin (GA1) is made, and without this growth hormone the stem stays short.', 3)),
 Q('Sperm tsRNAs from male mice fed a high-fat diet were injected into normal zygotes.',
   text('What did this show about inheritance?', 2, [
     P('Offspring developed metabolic disorders (glucose and insulin intolerance)', r'metabolic|glucose|insulin|disorder'),
     P('Information can be inherited without any change in DNA sequence (via RNA in sperm)', r'without|not (the )?dna|rna|non[- ]?dna|sequence')],
     'The offspring developed glucose and insulin intolerance even though their DNA was normal: a father\'s diet can be passed on through RNA fragments in sperm, without any change in DNA sequence.', 3)),
 Q('Extended answer.',
   text('Describe the experimental evidence that established DNA, rather than protein, as the hereditary material. Refer to at least two separate experiments.', 8, [
     P('Griffith: heat-killed IIIS + live IIR killed mice; living IIIS recovered (a transforming principle)', [r'griffith|iiis|smooth|virulent', r'heat|dead|killed', r'transform']),
     P('Avery, MacLeod and McCarty treated IIIS extract with different enzymes', [r'avery|macleod|mccarty', r'enzyme|extract|dnase|rnase|protease']),
     P('Only DNase abolished transformation', [r'dnase|deoxyribonuclease', r'abolish|no transform|not transform|stop|prevent|destroy']),
     P('RNase and protease did not, so DNA is the transforming principle', [r'rnase|protease', r'still|did not|didn.t|no effect|occur']),
     P('Hershey and Chase labelled T2 phage DNA with ³²P and protein with ³⁵S', [r'hershey|chase|phage|t2', r'32|35|label|isotope|radioactiv']),
     P('After blending and centrifugation, ³²P was in the pellet (inside the bacteria)', [r'32|phosph', r'pellet|inside|bacteri']),
     P('³⁵S stayed in the supernatant with the phage coats', [r'35|sul(ph|f)', r'supernatant|outside|coat|ghost']),
     P('So DNA enters the cell and directs new phage; DNA, not protein, is the genetic material', [r'\bdna\b', r'enter|genetic material|hereditary material|not protein'])],
     'Griffith (1928) found that heat-killed virulent IIIS pneumococci mixed with live harmless IIR killed mice, and living IIIS were recovered: a transforming principle passed from dead to living cells. Avery, MacLeod and McCarty (1944) treated IIIS extract with DNase, RNase or protease. Only DNase abolished transformation; RNase and protease had no effect, so the transforming principle is DNA. Hershey and Chase (1952) labelled T2 phage DNA with ³²P and protein with ³⁵S, infected <em>E. coli</em>, blended and centrifuged. ³²P was found in the pellet with the bacteria, while ³⁵S stayed in the supernatant with the empty coats, so only DNA entered the cell to direct new phage. DNA, not protein, is the hereditary material.', 12)),
])

# ------------------------------------------------------------------ Lecture 2
L['l2'] = ('Structure of DNA and RNA', 'Lecture 2', '01 Year 1/Molecular Biology and Genetics/Lectures/02 Structure of DNA and RNA/Structure of DNA and RNA', [
 Q('The diagram shows a nucleotide.',
   label('Name the labelled parts.', 'nucleotide.jpg', [
     ('Phosphate', [r'phosph'], 'phosphate'), ('Pentose', [r'pentose|sugar|ribose'], 'pentose sugar'),
     ('Purine or', [r'base|purine|pyrimidine|nitrogen'], 'nitrogenous (purine or pyrimidine) base')]),
   text('State the chemical difference between ribose and deoxyribose, and which nucleic acid each is found in.', 2, [
     P('Ribose has an OH on the 2′ carbon; deoxyribose has only H there', [r'2|second|two', r'oh|hydroxyl']),
     P('Ribose is in RNA, deoxyribose in DNA', [r'ribose.{0,40}rna|rna.{0,40}ribose', r'deoxyribose.{0,40}dna|dna.{0,40}deoxy'])],
     'Ribose carries an OH group on its 2′ carbon, where deoxyribose has just an H. Ribose is the sugar of RNA, deoxyribose of DNA.', 2)),
 Q('Bases are either purines or pyrimidines.',
   mcq('Which pair are both purines?', ['Adenine and thymine', 'Adenine and guanine', 'Cytosine and uracil', 'Guanine and cytosine'], 1,
       'Purines (adenine, guanine) have two fused rings; pyrimidines (cytosine, thymine, uracil) have one.'),
   text('Explain why a purine always pairs with a pyrimidine in the double helix.', 2, [
     P('Purines have two rings and pyrimidines one, so a purine + pyrimidine pair has a constant width', [r'two rings|2 rings|double ring|larger|bigger', r'width|diameter|distance|fit|constant|same size|2 ?nm|20']),
     P('Specific hydrogen bonding: A pairs with T (2 bonds), G with C (3 bonds)', [r'a.{0,6}t|adenine.{0,20}thymine', r'g.{0,6}c|guanine.{0,20}cytosine|hydrogen'])],
     'A purine (two rings) opposite a pyrimidine (one ring) keeps the helix a constant 2 nm wide, and hydrogen bonding is only right for A–T (two bonds) and G–C (three bonds).', 3)),
 Q('Chargaff measured the base composition of DNA from different species (molar %).',
   num('A sample of double-stranded DNA is 30% adenine. What percentage is guanine?', 20, tol=0.01, unit='%', working='A = T = 30%, so A + T = 60%. G + C = 40%, and G = C, so G = 20%.'),
   text('State Chargaff\'s rule and explain how it supports the double-helix model.', 3, [
     P('%A = %T and %G = %C in any species', [r'a.{0,12}(=|equal|same).{0,12}t|amount of a .*t', r'g.{0,12}(=|equal|same).{0,12}c']),
     P('The ratio of A+T to G+C varies between species', r'vari|differ|ratio'),
     P('Because A pairs with T and G with C (complementary base pairing) across the two strands', r'pair|complementar')],
     'In any double-stranded DNA, %A = %T and %G = %C, although the A+T : G+C ratio varies between species. Equal amounts are exactly what you expect if every A on one strand pairs with a T on the other and every G with a C.', 3),
   table={'head': ['DNA source', 'A', 'T', 'G', 'C'], 'rows': [['human', '30.9', '29.4', '19.9', '19.8'], ['sea urchin', '32.8', '32.1', '26.0', '25.7'], ['<em>E. coli</em>', '24.7', '23.6', '26.0', '25.7'], ['<em>Sarcina</em>', '13.4', '12.4', '37.1', '37.1']]}),
 Q('Nucleotides in a strand are joined by phosphodiester bonds.',
   text('Describe a phosphodiester bond and explain how it gives a strand direction.', 3, [
     P('A phosphate links the 3′ carbon (3′-OH) of one sugar to the 5′ carbon of the next', [r'3', r'5', r'phosphat|sugar|carbon']),
     P('It is a covalent bond in the sugar–phosphate backbone', r'covalent|backbone'),
     P('Each strand has a free 5′ phosphate end and a free 3′-OH end, so it runs 5′→3′', [r'5', r'3', r'end|direction|polar'])],
     'A phosphate group bridges the 3′ carbon of one sugar and the 5′ carbon of the next, forming the covalent sugar–phosphate backbone. One end of a strand has a free 5′ phosphate and the other a free 3′-OH, giving the strand a 5′→3′ direction.', 4),
   seq('Write the strand complementary to 5′-ATGCTTAG-3′, reading 5′ to 3′.', ['CTAAGCAT'], marks=2, half=['TACGAATC'],
       model='5′-CTAAGCAT-3′', note='TACGAATC has the right bases but is written 3′→5′: half marks.')),
 Q('Watson and Crick\'s model of B-DNA drew on Franklin\'s X-ray diffraction images.',
   label('Fill in the dimensions and features.', 'helix.jpg', [
     ('20 Å', [r'20|2 ?nm'], '20 Å (2 nm) diameter'), ('34 Å', [r'34|3\.4 ?nm'], '34 Å (3.4 nm) per turn'),
     ('Minor', [r'minor'], 'minor groove'), ('Major', [r'major'], 'major groove')]),
   text('Describe four structural features of the B-DNA double helix.', 4, [
     P('Two antiparallel strands', r'antiparallel|opposite direction'),
     P('Sugar–phosphate backbone on the outside, bases on the inside', r'backbone|outside|inside'),
     P('Complementary base pairs held by hydrogen bonds (A–T two, G–C three)', r'hydrogen|complementar|a.?t.{0,30}g.?c'),
     P('Right-handed helix about 2 nm wide, about 10 bp (3.4 nm) per turn, 0.34 nm per bp', r'right[- ]hand|2 ?nm|20 ?å|10 ?bp|10\.4|3\.4|0\.34|per turn'),
     P('Major and minor grooves', r'groove')],
     'Two antiparallel strands wind into a right-handed helix about 2 nm wide, with about 10 base pairs (3.4 nm) per turn. The sugar–phosphate backbones are on the outside and the bases stack inside, paired A–T (two hydrogen bonds) and G–C (three). The twisting creates major and minor grooves.', 5)),
 Q('Three main types of RNA take part in gene expression.',
   text('Name the three main types of RNA and give the role of each.', 3, [
     P('mRNA carries the genetic message (copy of the gene) to the ribosome', [r'mrna|messenger', r'carr|copy|message|code|template']),
     P('tRNA brings amino acids to the ribosome and reads codons with its anticodon', [r'trna|transfer', r'amino acid|anticodon|adaptor|deliver|carr|bring']),
     P('rRNA forms the ribosome (structure and catalysis)', [r'rrna|ribosomal', r'ribosome|structur|catal|peptide'])],
     'mRNA carries a copy of the gene\'s sequence to the ribosome; tRNA delivers amino acids, matching codons with its anticodon; rRNA is the structural and catalytic core of the ribosome.', 3),
   mcq('According to the central dogma, which transfer of sequence information never happens?', ['DNA to DNA', 'DNA to RNA', 'RNA to protein', 'Protein to nucleic acid'], 3,
       'Information can flow between nucleic acids and from nucleic acid to protein, but never back out of protein (Crick, 1970).')),
 Q('Extended answer.',
   text('Explain how the structure of DNA relates to its function as the molecule of heredity. Refer to base pairing, strand directionality, and the semiconservative model of replication.', 8, [
     P('Information is stored in the sequence of the four bases', [r'sequence|order', r'base']),
     P('Complementary base pairing: A–T and G–C, by hydrogen bonds', [r'complementar|a.?t|adenine', r'pair|hydrogen|g.?c']),
     P('So each strand can act as a template for an accurate copy', r'template'),
     P('Hydrogen bonds are weak, so the strands can separate for copying, while the covalent backbone keeps the sequence stable', [r'hydrogen|weak', r'separat|unzip|unwind|stable|covalent|backbone']),
     P('The strands are antiparallel, each with a 5′ and a 3′ end', [r'antiparallel|opposite', r'5|3']),
     P('Polymerase only adds to the 3′ end (5′→3′), giving leading and lagging strands', [r'5|3', r'polymerase|leading|lagging|okazaki|direction']),
     P('Semiconservative: each new molecule keeps one parental strand and one new strand', [r'semi', r'one (old|parent|original)|old.{0,30}new|parental|half']),
     P('Shown by Meselson and Stahl (¹⁵N/¹⁴N), so genetic information is passed on faithfully', r'meselson|stahl|15|faithful|accura|identical|copies')],
     'Genetic information is stored in the sequence of four bases. Bases pair specifically, A with T and G with C, through hydrogen bonds, so each strand carries the information to rebuild its partner: it can act as a template. The hydrogen bonds are weak enough for the strands to separate for copying, while the covalent sugar–phosphate backbone keeps the sequence stable. The strands are antiparallel, and polymerase only adds nucleotides to a 3′ end, so one new strand is made continuously (leading) and the other in Okazaki fragments (lagging). Replication is semiconservative: each daughter molecule has one parental and one new strand, as Meselson and Stahl showed with ¹⁵N and ¹⁴N, so the sequence is copied faithfully to each daughter cell.', 12)),
])

# ------------------------------------------------------------------ Lecture 3
L['l3'] = ('DNA Replication', 'Lecture 3', '01 Year 1/Molecular Biology and Genetics/Lectures/03 DNA Replication/DNA Replication', [
 Q('Meselson and Stahl grew <em>E. coli</em> for many generations in ¹⁵N medium, moved them to ¹⁴N medium, and separated the DNA by density-gradient centrifugation after each round of replication.',
   text('Why was the DNA first labelled with ¹⁵N and then grown in ¹⁴N?', 2, [
     P('¹⁵N is a heavy isotope incorporated into the bases, making the parental DNA denser', [r'15|heavy|dens', r'base|nitrogen|incorporat|label|dens']),
     P('So old (heavy) and new (light) strands can be told apart by density', r'old|parent|new|distinguish|tell apart|separat|light')],
     '¹⁵N is built into the bases, so parental DNA is heavy. After the switch, new strands are made with ¹⁴N and are light, so old and new DNA can be told apart by density.', 3),
   text('Predict the bands after <strong>one</strong> round of replication in ¹⁴N for the conservative, semiconservative and dispersive models.', 3, [
     P('Conservative: two bands, one heavy and one light', [r'conservative', r'heavy', r'light']),
     P('Semiconservative: one intermediate band', [r'semi', r'intermediate|hybrid|one band|single band|middle']),
     P('Dispersive: one intermediate band', [r'dispers', r'intermediate|hybrid|one band|single band|middle'])],
     'Conservative: one heavy and one light band. Semiconservative: one intermediate band. Dispersive: one intermediate band.', 3),
   text('After two rounds they saw one intermediate band and one light band. Which model does this support, and why does it rule out the dispersive model?', 2, [
     P('Semiconservative', r'semi'),
     P('Dispersive would give a single band (lighter than intermediate), not two separate bands', [r'dispers', r'single|one band|not two|between|no light|would not'])],
     'Semiconservative replication. Dispersive replication would give a single band between intermediate and light, never a separate light band.', 3)),
 Q('DNA polymerases cannot start a new strand on their own.',
   text('Explain why a primer is needed and how it is made.', 2, [
     P('DNA polymerase can only add nucleotides to an existing free 3′-OH; it cannot start a chain', [r'3|existing|free end|start', r'oh|end|chain|add|cannot|can.t|only']),
     P('Primase makes a short RNA primer (10–12 nt in E. coli)', [r'primase', r'rna'])],
     'DNA polymerase can only extend an existing free 3′-OH, so it cannot start a strand from scratch. Primase lays down a short RNA primer (10 to 12 nucleotides in <em>E. coli</em>) to give it that 3′ end.', 2),
   text('Describe how DNA polymerase adds a nucleotide to the growing strand.', 3, [
     P('The incoming dNTP pairs with the complementary base on the template', r'complementar|template|pair'),
     P('Its 5′ phosphate joins the free 3′-OH of the growing chain, forming a phosphodiester bond', [r'3', r'5|phosphodiester|phosphate']),
     P('Pyrophosphate (two phosphates) is released', r'pyrophosphate|ppi|two phosphate|2 phosphate|diphosphate')],
     'A dNTP that base-pairs with the template enters; its 5′ α-phosphate is joined to the 3′-OH at the end of the growing strand by a phosphodiester bond, and pyrophosphate is released.', 3),
   mcq('Which enzyme removes RNA primers in <em>E. coli</em> and replaces them with DNA?', ['DNA polymerase III', 'DNA polymerase I', 'Primase', 'DNA ligase'], 1)),
 Q('New DNA is made at a replication fork.',
   text('Explain why one strand is made continuously and the other in fragments.', 4, [
     P('DNA polymerase only synthesises 5′→3′', [r'5', r'3', r'only|always|direction']),
     P('The two template strands are antiparallel', r'antiparallel|opposite'),
     P('Leading strand made continuously in the direction of fork movement', [r'leading', r'continuous']),
     P('Lagging strand made discontinuously as Okazaki fragments, each with its own primer, joined by ligase', [r'lagging|okazaki', r'fragment|discontinuous|primer|ligase'])],
     'Polymerase only works 5′→3′ and the templates are antiparallel. On one template that direction follows the fork, so the leading strand is made continuously. On the other it runs away from the fork, so the lagging strand is made in short Okazaki fragments, each started by a primer and later joined by DNA ligase.', 5),
   label('Name the labelled proteins and structures at the <em>E. coli</em> fork.', 'l3_fork_detail.jpg', [
     ('Helicase', [r'helicase|dnab'], 'helicase (DnaB/DnaC)'), ('DNA gyrase', [r'gyrase|topoisomerase'], 'DNA gyrase'),
     ('Single-stranded', [r'single|ssb'], 'single-stranded binding proteins'), ('Okazaki', [r'okazaki'], 'Okazaki fragments'), ('RNA primer', [r'primer'], 'RNA primer')])),
 Q('State the role of each enzyme in <em>E. coli</em> DNA replication.',
   text('(a) Helicase', 1, [P('Unwinds the double helix at the fork', r'unwind|separat|break.{0,20}hydrogen|open')], 'Unwinds the helix by breaking the hydrogen bonds between the strands.', 1),
   text('(b) DNA gyrase', 1, [P('Removes the supercoiling ahead of the fork (a topoisomerase)', r'supercoil|tension|twist|topoisomerase|coil')], 'Relieves the supercoiling that builds up ahead of the fork.', 1),
   text('(c) DNA ligase', 1, [P('Joins Okazaki fragments by sealing the phosphodiester bond', r'join|seal|ligat|nick|okazaki')], 'Seals the nick between Okazaki fragments with a phosphodiester bond.', 1),
   text('(d) DNA polymerase III', 1, [P('Main replicative polymerase: synthesises most of the new DNA', r'synthes|most|main|add|extend|elongat|replicat|make')], 'The main replicative polymerase, making most of the new DNA.', 1)),
 Q('Replication in <em>E. coli</em> starts at oriC and ends at Ter sites.',
   text('Describe oriC and how replication is initiated there.', 3, [
     P('oriC is 245 bp with three 13 bp repeats and four 9 bp repeats', r'245|13 ?bp|9 ?bp|repeat'),
     P('DnaA proteins (with ATP) bind the 9 bp repeats and the 13 bp (AT-rich) region is denatured', [r'dnaa', r'bind|9|denatur|open|melt|unwind']),
     P('DnaB helicase is loaded (with DnaC) and unwinds, so primase and polymerase can start', [r'dnab|helicase', r'load|bind|unwind|dnac'])],
     'oriC is 245 bp, with three 13 bp and four 9 bp repeats. About 20 ATP-bound DnaA proteins bind the 9 bp repeats and wrap the DNA, which melts the AT-rich 13 bp repeats. DnaC then loads DnaB helicase onto each strand to unwind the DNA ready for priming.', 4),
   text('Explain how replication terminates.', 2, [
     P('The two forks meet in a terminus region containing Ter sequences', [r'ter', r'meet|terminus|site|sequence']),
     P('Tus protein binds Ter and arrests a fork approaching from one direction only (fork trap)', [r'tus', r'arrest|stop|block|one direction|trap'])],
     'The two forks, moving in opposite directions from oriC, meet in a terminus region of Ter sequences. Tus bound to Ter lets a fork through from one direction but stops one coming from the other, trapping the forks.', 3)),
 Q('Eukaryotic chromosomes are linear and very long.',
   text('Explain how eukaryotes replicate such long DNA quickly.', 2, [
     P('Many origins of replication are used at once', r'many|multiple|several|lots', ),
     P('Each forms a replicon (40–100 kb), replicated bidirectionally, and the bubbles fuse', r'replicon|bubble|fuse|bidirection|40|100')],
     'They fire many origins at once. Each replicon (40 to 100 kb) is copied bidirectionally from its origin and neighbouring bubbles fuse.', 2),
   text('Explain the end-replication problem and how telomerase solves it.', 3, [
     P('When the last RNA primer on the lagging strand is removed, the end cannot be filled in', [r'primer|lagging', r'remov|end|cannot|gap|fill']),
     P('So chromosomes would shorten with every round of replication', r'shorten|lose|lost|shorter'),
     P('Telomerase uses its own RNA template to add repeats to the 3′ end (telomeres)', [r'telomerase', r'rna|template|repeat|add|extend'])],
     'When the final primer on the lagging strand is removed, there is no 3′ end to fill the gap from, so linear chromosomes would shorten each round. Telomerase carries its own RNA template and uses it to add repeats (e.g. TTGGGG) to the 3′ end, which is then completed by normal lagging-strand synthesis.', 4)),
])

# ------------------------------------------------------------------ Lecture 5
L['l5'] = ('The Genetic Code', 'Lecture 5', '01 Year 1/Molecular Biology and Genetics/Lectures/05 The Genetic Code/The Genetic Code', [
 Q('In the 1960s Brenner predicted that the genetic code is read in triplets.',
   text('Explain his reasoning.', 2, [
     P('4 bases: singles give 4 combinations and pairs give 16, too few for 20 amino acids', [r'4|four', r'16|sixteen|too few|not enough|fewer']),
     P('Triplets give 4³ = 64 codons, enough for 20 (with redundancy)', r'64|4 ?[x×] ?4 ?[x×] ?4|4\^?3|4³')],
     'With 4 bases, single bases give 4 combinations and pairs only 16, fewer than the 20 amino acids. Triplets give 4 × 4 × 4 = 64 codons, more than enough.', 2),
   text('How did Crick\'s frameshift experiments in phage T4 rII confirm a triplet code?', 3, [
     P('Inserting or deleting 1 or 2 nucleotides abolished gene function (shifted the reading frame)', [r'1|2|one|two|single', r'loss|lost|abolish|non[- ]?functional|frameshift|out of frame|destroy']),
     P('Inserting or deleting 3 often restored function', [r'three|3', r'restor|function|normal|back in frame|work']),
     P('Because three restores the reading frame, the code is read in groups of three', r'frame|triplet|three')],
     'Adding or removing one or two nucleotides shifted the reading frame and destroyed rII function, but three insertions (or deletions) often restored it, because three puts the reading frame back in register. So codons are three bases long.', 3)),
 Q('Nirenberg and Matthaei added synthetic RNAs to a cell-free protein-synthesis system and measured radioactive phenylalanine incorporated into protein.',
   text('Name the components of the cell-free system.', 2, [
     P('A synthetic RNA template (e.g. poly-U)', r'rna|poly'), P('tRNAs with (radioactive) amino acids', r'trna|amino acid'),
     P('Ribosomes', r'ribosom'), P('An energy source (GTP)', r'gtp|atp|energy')],
     'Synthetic mRNA such as poly-U, tRNAs carrying amino acids (one radioactive), ribosomes, and an energy source (GTP).', 3),
   text('What do the results show, and how was poly-U made without a DNA template?', 3, [
     P('Only poly-U gave high radioactivity in protein (about 39,800 counts/min against about 40)', r'poly[- ]?u|39|high'),
     P('So UUU codes for phenylalanine', [r'uuu', r'phe']),
     P('Poly-U was made with polynucleotide phosphorylase, which needs no template', r'phosphorylase|pnpase')],
     'Poly-U gave about 39,800 counts per minute against about 40 to 50 for poly-A, poly-C or no RNA, so UUU codes for phenylalanine. The RNA was made by polynucleotide phosphorylase, which joins ribonucleotides without a template.', 3),
   table={'head': ['Artificial mRNA', '¹⁴C-Phe in protein (counts/min)'], 'rows': [['none', '44'], ['poly-U', '39,800'], ['poly-A', '50'], ['poly-C', '38']]}),
 Q('Khorana made repeating copolymers and found which amino acids they coded for.',
   text('Repeating UC (UCUCUC…) gave a polypeptide containing leucine and serine. Explain why.', 2, [
     P('It contains two codons, UCU and CUC, read alternately', [r'ucu', r'cuc']),
     P('One codes leucine and the other serine, alternating in a single polypeptide', r'leu|ser|alternat')],
     'Repeating UC is read as alternating UCU and CUC codons, so one polypeptide with alternating serine (UCU) and leucine (CUC).', 2),
   text('Repeating UUC (UUCUUC…) gave three different polypeptides, each made of one amino acid. Explain why.', 2, [
     P('It can be read in three frames: UUC, UCU or CUU', [r'uuc', r'ucu', r'cuu']),
     P('Each frame repeats one codon, giving polyPhe, polySer or polyLeu', r'phe|ser|leu|frame|start')],
     'Depending on where reading starts, the message is UUC UUC…, UCU UCU… or CUU CUU…, so three homopolymers: polyphenylalanine, polyserine and polyleucine.', 3)),
 Q('Use the codon table to answer.',
   seq('Translate this mRNA from its start codon: 5′-GCAUGGCUUCAAAGUGAGC-3′. Give the amino acids (three-letter codes).', ['MET ALA SER LYS'], marks=3, mode='aa',
       model='Met-Ala-Ser-Lys (AUG GCU UCA AAG, then UGA stop)'),
   text('Explain why a change in the third base of a codon is often silent.', 2, [
     P('The code is redundant: most amino acids have several codons', r'redundan|degenera|more than one|several|multiple'),
     P('Synonymous codons usually differ only at the third base (wobble), so the amino acid is unchanged', r'third|3rd|wobble|same amino acid|unchanged|synonym')],
     '61 codons code for 20 amino acids, so most have several codons, and these usually differ only in the third base. Changing it often gives a codon for the same amino acid.', 2),
   img=A + 'l5_codon_table.jpg'),
 Q('Features of the genetic code.',
   mcq('Which three codons are stop codons?', ['UAA, UAG, UGA', 'UAA, UGG, UGA', 'AUG, UAG, UGA', 'UAA, UAG, UAC'], 0),
   text('Explain what "non-overlapping" and "commaless" mean.', 2, [
     P('Non-overlapping: each nucleotide is part of only one codon', [r'overlap|each nucleotide|one codon|only one', r'one|single|only']),
     P('Commaless: codons follow one another with no gaps or spacers', r'gap|space|punctuat|no break|continuous|one after')],
     'Non-overlapping: each nucleotide belongs to one codon only. Commaless: codons are read one after another with no gaps or spacer bases between them.', 2),
   text('State the wobble hypothesis.', 2, [
     P('The first two codon bases pair strictly with the anticodon', r'first two|1st|two bases|first and second'),
     P('The third position pairs less strictly, so one tRNA can read more than one codon', [r'third|3rd', r'less|loose|non[- ]?standard|more than one|several'])],
     'The first two bases of a codon pair strictly with the anticodon, but pairing at the third position is looser, so one tRNA can read more than one codon.', 2),
   text('Why is the code described as only "nearly" universal?', 2, [
     P('In some species UGA codes for selenocysteine', [r'uga', r'selenocysteine|sec']),
     P('In some species UAG codes for pyrrolysine', [r'uag', r'pyrrolysine|pyl'])],
     'In some proteins of some species, the stop codons are read differently: UGA as selenocysteine and UAG as pyrrolysine.', 2)),
])

# ------------------------------------------------------------------ Lecture 6
L['l6'] = ('Transcription', 'Lecture 6', '01 Year 1/Molecular Biology and Genetics/Lectures/06 Transcription/Transcription (Lecture 6)', [
 Q('Part of a gene\'s coding strand reads 5′-ATGGCCAAGTGGTAA-3′.',
   seq('Write the mRNA transcribed from this gene, 5′ to 3′.', ['AUGGCCAAGUGGUAA'], marks=2, half=['AUGGCCAAGTGGTAA', 'UACCGGUUCACCAUU'],
       model='5′-AUGGCCAAGUGGUAA-3′', note='The mRNA has the same sequence as the coding strand, with U for T.'),
   seq('Give the peptide it encodes (three-letter codes).', ['MET ALA LYS TRP'], marks=2, mode='aa', model='Met-Ala-Lys-Trp, then UAA stop'),
   text('Which strand does RNA polymerase read, and in which direction is the RNA made?', 2, [
     P('It reads the template (non-coding) strand, 3′→5′', r'template|non[- ]?coding|antisense'),
     P('RNA is made 5′→3′', [r'5', r'3'])],
     'RNA polymerase reads the template strand 3′→5′ and builds the RNA 5′→3′.', 2),
   img=A + 'l5_codon_table.jpg'),
 Q('The figure shows a typical <em>E. coli</em> promoter.',
   label('Fill in the consensus sequences and spacings.', 'l6_promoter.jpg', [
     ('−35', [r'ttgaca'], 'TTGACA (−35 box)'), ('−10', [r'tataat'], 'TATAAT (−10 box)'), ('15 to', [r'15|20|17'], '15 to 20 bp'), ('5 to', [r'5|9|7'], '5 to 9 bp')]),
   text('What is the role of the sigma factor?', 2, [
     P('It recognises and binds the −10 and −35 boxes of the promoter', [r'promoter|-10|−10|-35|−35|box', r'bind|recogni']),
     P('So RNA polymerase starts at the right place; it leaves once elongation begins; different sigmas switch on different genes', r'right place|start|initiat|dissociat|leave|different')],
     'σ binds the −35 and −10 boxes so the RNA polymerase core starts at the right place, then leaves as the chain grows. Different σ factors recognise different sets of promoters.', 2),
   text('Distinguish intrinsic and extrinsic termination.', 2, [
     P('Intrinsic: a GC-rich hairpin in the RNA (followed by Us) releases polymerase and RNA', [r'intrinsic', r'hairpin|loop|stem']),
     P('Extrinsic: needs the rho protein', [r'extrinsic|rho', r'rho|protein'])],
     'Intrinsic terminators form an RNA hairpin that makes the polymerase release the RNA. Extrinsic (rho-dependent) termination needs the rho protein.', 2)),
 Q('The <em>lac</em> operon is controlled by lactose and by glucose.',
   text('(a) Glucose present, lactose absent. State the level of transcription and explain it.', 2, [
     P('Off / no transcription', r'off|no (transcription|expression)|none|repress'),
     P('The repressor (from lacI) is bound to the operator, blocking RNA polymerase', [r'repressor', r'operator|bound|block'])],
     'Off: with no lactose, the lacI repressor sits on the operator and blocks RNA polymerase.', 2),
   text('(b) Glucose present, lactose present.', 2, [
     P('Low', r'low|weak|little|reduced|basal'),
     P('Repressor released by lactose (allolactose), but cAMP is low so CAP does not activate', [r'camp|cap', r'low|not|no|cannot|poor'])],
     'Low: lactose (allolactose) releases the repressor, but glucose keeps cAMP low so CAP–cAMP does not bind and activation is weak.', 2),
   text('(c) Glucose absent, lactose present.', 2, [
     P('High', r'high|strong|on|maxim|induced'),
     P('Repressor released and cAMP–CAP binds the CAP site, activating transcription', [r'camp|cap', r'bind|activat|high'])],
     'High: the repressor is released, and with no glucose cAMP rises; cAMP–CAP binds next to the promoter and strongly activates transcription.', 2),
   text('(d) A lacI mutant whose repressor cannot bind the operator, with no lactose. Explain the result.', 2, [
     P('Constitutive expression (always on)', r'constitutive|always|on|express'),
     P('The repressor cannot block the operator', r'cannot|can.t|unable|not bind|no longer|never|doesn.t bind|does not bind')],
     'Constitutive expression: the faulty repressor never sits on the operator, so the genes are transcribed even without lactose.', 2),
   text('(e) An Iˢ mutant whose repressor cannot bind lactose, with lactose present.', 2, [
     P('Repressed / never induced (stays off)', r'off|repress|never|no (transcription|expression)|not induc'),
     P('The repressor stays on the operator because lactose cannot release it', r'stays|remain|always bound|cannot|can.t|not bind|never leave')],
     'Repressed: lactose cannot bind the repressor, so it never leaves the operator and the operon stays off.', 2)),
 Q('Eukaryotic transcription and RNA processing.',
   text('Describe how transcription by RNA polymerase II is initiated.', 3, [
     P('Chromatin remodelling (e.g. SWI–SNF) exposes the promoter', r'chromatin|remodel|swi|snf|nucleosome'),
     P('TBP binds the TATA box; TAFs help Pol II bind, forming the basal transcription complex', [r'tbp|tata', r'bind|box|taf|basal']),
     P('Transcription factors at enhancers increase initiation (up to about 100×)', r'enhancer|transcription factor|activator|100')],
     'Chromatin remodelling complexes such as SWI–SNF expose the promoter. TBP binds the TATA box, and TBP-associated factors help RNA Pol II bind, forming the basal transcription complex. Transcription factors bound at enhancers raise initiation up to about 100-fold.', 4),
   text('Describe the processing that turns a primary transcript into mature mRNA.', 4, [
     P('5′ cap: a G added by a 5′–5′ triphosphate link, then methylated', [r'cap', r'5|g|guan|methyl']),
     P('3′ end cut downstream of AAUAAA', r'aauaaa|cleav|cut'),
     P('Poly-A polymerase adds 100–200 A (poly-A tail)', r'poly[- ]?a'),
     P('Splicing removes introns and joins exons', [r'splic', r'intron|exon']),
     P('By the spliceosome (snRNPs) at the splice donor, branch site and acceptor', r'spliceosome|snrnp|donor|acceptor|branch|lariat')],
     'A G is added to the 5′ end through a 5′–5′ triphosphate link and methylated (the cap). The 3′ end is cut downstream of AAUAAA and poly-A polymerase adds 100 to 200 A. The spliceosome, using snRNPs that pair with the splice donor, branch site and acceptor, cuts out the introns as lariats and joins the exons.', 5),
   text('Explain why alternative splicing matters.', 2, [
     P('Exons can be joined in different combinations', r'different|combination|skip|alternative'),
     P('So one gene gives several mRNAs and proteins, increasing protein diversity', r'more than one|several|many|diversity|multiple|different protein')],
     'Joining exons in different combinations lets one gene make several mRNAs and proteins, increasing protein diversity without more genes.', 2)),
])

# ------------------------------------------------------------------ Lecture 7
L['l7'] = ('Translation', 'Lecture 7', '01 Year 1/Molecular Biology and Genetics/Lectures/07 Translation/Translation (Lecture 7)', [
 Q('The diagram shows a ribosome.',
   label('Name the labelled sites and subunits.', 'alberts7e_fig6-66.jpg', [
     ('E site', [r'\be\b|exit'], 'E site'), ('P site', [r'\bp\b|peptidyl'], 'P site'), ('A site', [r'\ba\b|aminoacyl'], 'A site'),
     ('large', [r'large|50'], 'large subunit (50S)'), ('small', [r'small|30'], 'small subunit (30S)')]),
   text('State what occupies each of the A, P and E sites during elongation.', 3, [
     P('A site: incoming aminoacyl (charged) tRNA', [r'\ba\b|aminoacyl site', r'charged|aminoacyl|incoming|new']),
     P('P site: peptidyl-tRNA carrying the growing chain', [r'\bp\b|peptidyl site', r'peptid|growing|chain']),
     P('E site: uncharged tRNA about to leave', [r'\be\b|exit', r'uncharged|empty|leav|exit|free'])],
     'A site: the incoming aminoacyl-tRNA. P site: the peptidyl-tRNA holding the growing chain. E site: the uncharged tRNA about to leave.', 3)),
 Q('tRNAs must be charged before translation.',
   text('Describe how a tRNA is charged.', 3, [
     P('An aminoacyl-tRNA synthetase specific to the amino acid', r'synthetase'),
     P('Uses ATP to activate the amino acid (aminoacyl-AMP)', r'atp|amp|adenyl'),
     P('Attaches the amino acid to the 3′ end of the matching tRNA', [r'attach|transfer|link|join|bond', r'3|end|trna'])],
     'An aminoacyl-tRNA synthetase uses ATP to activate the amino acid as aminoacyl-AMP, then transfers it to the 3′ end of the matching tRNA, making an aminoacyl (charged) tRNA.', 3),
   num('What is the minimum number of different tRNAs needed to read all 61 sense codons?', 31),
   text('Explain why fewer than 61 tRNAs are needed.', 1, [P('Wobble at the third codon position lets one tRNA read more than one codon', r'wobble|third|more than one codon')],
        'Wobble pairing at the third codon position lets one tRNA read several codons.', 2)),
 Q('Translation in bacteria.',
   text('Describe initiation of translation in bacteria.', 4, [
     P('Initiation factors and mRNA bind the small (30S) subunit', [r'30s|small', r'bind|ifs?|initiation factor']),
     P('The Shine–Dalgarno sequence (AGGAGG) pairs with 16S rRNA, positioning AUG', [r'shine|dalgarno|aggagg|ribosome binding', r'16s|pair|position|rrna']),
     P('IF2 (with GTP) brings fMet-tRNA, whose UAC anticodon pairs with AUG in the P site', [r'fmet|formyl|initiator', r'aug|p site|if2|uac']),
     P('The 50S subunit joins and the initiation factors leave', [r'50s|large', r'join|bind|leave|releas'])],
     'IF1 and IF3 bind the 30S subunit, which binds the mRNA when its Shine–Dalgarno sequence (AGGAGG) pairs with 16S rRNA, placing AUG in position. IF2–GTP brings fMet-tRNA, whose UAC anticodon pairs with AUG in the P site. The 50S subunit then joins, and IF1 and IF2 leave.', 5),
   text('Describe one cycle of elongation.', 4, [
     P('EF-Tu (with GTP) brings a charged tRNA to the A site, matching codon and anticodon', [r'ef[- ]?tu|charged|aminoacyl', r'a site|a-site']),
     P('Peptidyl transferase forms a peptide bond, moving the chain onto the A-site tRNA', [r'peptide bond|peptidyl transferase', r'form|transfer|join|catal']),
     P('This is catalysed by the 23S rRNA (the ribosome is a ribozyme)', r'23s|rrna|ribozyme'),
     P('EF-G moves the ribosome one codon (3 nt); P-site tRNA to E and exits, A-site tRNA to P', r'ef[- ]?g|transloc|move|shift|three|3 nucleotides|one codon')],
     'EF-Tu–GTP delivers a charged tRNA to the A site, where it is accepted if its anticodon matches the codon. Peptidyl transferase activity of the 23S rRNA joins the chain to the new amino acid. EF-G then moves the ribosome one codon along: the empty tRNA moves from P to E and leaves, and the peptidyl-tRNA moves from A to P.', 5),
   num('At about 15 amino acids per second, how many seconds does a ribosome take to make a 300-amino-acid protein?', 20, tol=0.5, unit='s', working='300 ÷ 15 = 20 s.')),
 Q('Codons and anticodons pair antiparallel.',
   seq('Write the anticodon (5′ to 3′) of the tRNA that reads the codon 5′-GCA-3′.', ['UGC'], marks=1, half=['CGU'], model='5′-UGC-3′ (it pairs as 3′-CGU-5′)',
       note='CGU is the right bases written 3′→5′.'),
   text('Describe how translation is terminated.', 3, [
     P('A stop codon (UAA, UAG or UGA) enters the A site; no tRNA matches it', r'stop|uaa|uag|uga|termination codon'),
     P('A release factor binds: RF1 reads UAA/UAG and RF2 reads UAA/UGA', r'release factor|rf1|rf2|\brf'),
     P('Hydrolysis frees the polypeptide from the P-site tRNA; the ribosome dissociates', r'hydrolys|water|releas|dissociat|separat')],
     'When a stop codon reaches the A site, a release factor binds instead of a tRNA (RF1 for UAA or UAG, RF2 for UAA or UGA). It triggers hydrolysis of the bond between the polypeptide and the P-site tRNA, releasing the chain, and the ribosome comes apart.', 4),
   text('What is a polyribosome, and what is its advantage?', 2, [
     P('Several ribosomes translating one mRNA at the same time', [r'several|many|multiple|more than one', r'ribosom']),
     P('Many copies of the protein are made quickly from one mRNA', r'many|more|quick|fast|copies|efficien')],
     'Several ribosomes translating the same mRNA at once, so many copies of the protein are made quickly from one message.', 2)),
])

# ------------------------------------------------------------------ Lecture 8
L['l8'] = ('Plasmids and Recombinant DNA', 'Lecture 8', '01 Year 1/Molecular Biology and Genetics/Lectures/08 Plasmids and Recombinant DNA/Plasmids and Recombinant DNA (Lecture 8)', [
 Q('Restriction enzymes are central to recombinant DNA technology.',
   text('What does a restriction enzyme do, and what is special about its recognition site?', 3, [
     P('Binds a specific short DNA sequence (recognition site)', r'specific|recogni'),
     P('Cuts the phosphodiester backbone on both strands', r'phosphodiester|backbone|both strands|cut|cleav'),
     P('The site is usually palindromic (4 or 6 bp), reading the same 5′→3′ on both strands', r'palindrom|same on both|4|6')],
     'It binds a specific short sequence, its recognition site, and cuts the phosphodiester backbone of both strands there. Sites are usually 4 or 6 bp and palindromic: the same reading 5′→3′ on each strand.', 3),
   num('On average, how many base pairs apart will a 6-base recognition site occur in random DNA?', 4096, tol=1, unit='bp', working='4⁶ = 4096 bp.'),
   num('How many EcoRI sites (GAATTC) are in 5′-TTGAATTCAGCGATGAATTCTA-3′?', 2, working='GAATTC appears twice.'),
   text('Explain the difference between sticky and blunt ends, giving one enzyme that makes each.', 3, [
     P('Sticky ends: single-stranded overhangs from offset (staggered) cuts', [r'sticky|cohesive', r'overhang|single[- ]strand|offset|stagger']),
     P('Blunt ends: both strands cut at the same point, no overhang', [r'blunt', r'same|straight|no overhang|opposite']),
     P('e.g. EcoRI/HindIII/BamHI sticky; AluI blunt', [r'ecori|hindiii|bamhi|taqi', r'alui|haeiii'])],
     'Sticky (cohesive) ends have short single-stranded overhangs made by staggered cuts, e.g. EcoRI (G^AATTC). Blunt ends have none, because both strands are cut at the same point, e.g. AluI (AG^CT).', 3)),
 Q('Plasmid vectors carry DNA into bacteria.',
   text('List four properties of a good cloning vector.', 4, [
     P('Several unique restriction sites (a multiple cloning site)', r'restriction site|cloning site|polylinker|mcs'),
     P('Replicates independently in the host (has an origin of replication)', r'replicat|origin|ori\b'),
     P('A selectable marker, e.g. antibiotic resistance', r'select|marker|resist|antibiotic'),
     P('Easy to isolate / recover from the host', r'isolat|recover|purif|extract'),
     P('Small, or a reporter gene such as lacZ', r'small|reporter|lacz')],
     'Several unique restriction sites for inserting DNA; its own origin so it replicates independently; a selectable marker such as ampicillin resistance; and easy isolation from the host cell.', 4),
   label('Name the features of pUC18.', 'l8_s12.jpg', [
     ('Ampicillin', [r'amp|resist'], 'ampicillin resistance gene'), ('lacZ', [r'lac ?z|galactosidase'], 'lacZ gene'), ('Polylinker', [r'polylinker|multiple cloning|mcs|cloning site'], 'polylinker (multiple cloning site)')]),
   text('Explain how blue-white screening identifies bacteria carrying recombinant pUC18.', 4, [
     P('Plates contain ampicillin, so only cells that took up a plasmid grow', [r'ampicillin|antibiotic', r'only|select|grow|surviv|kill']),
     P('The polylinker lies inside lacZ, so an insert disrupts lacZ', [r'insert', r'disrupt|interrupt|inactivat|lacz']),
     P('Without working β-galactosidase, X-gal is not cleaved, so recombinant colonies are white', [r'white', r'x-?gal|galactosidase|recombinant|insert']),
     P('Colonies with no insert make β-galactosidase, cleave X-gal and turn blue', [r'blue', r'no insert|non[- ]?recombinant|self|empty|functional|cleav'])],
     'The plates hold ampicillin, so only cells with a plasmid grow. The polylinker sits inside lacZ, so an insert disrupts the gene: no β-galactosidase is made, X-gal is not cut, and the colony stays white. Plasmids without an insert make β-galactosidase, which cleaves X-gal to a blue product.', 5)),
 Q('Cloning a gene into a plasmid.',
   text('Describe the steps used to clone a DNA fragment into a plasmid and recover cells carrying it.', 4, [
     P('Cut vector and insert DNA with the same restriction enzyme', [r'same|both', r'enzyme|cut|digest']),
     P('Sticky ends anneal and DNA ligase seals the nicks (phosphodiester bonds)', r'ligase|ligat'),
     P('Introduce into bacteria by transformation (CaCl₂ + heat shock, or electroporation)', r'transform|heat shock|electropor'),
     P('Select on antibiotic / screen (e.g. X-gal) for recombinant colonies', r'select|screen|antibiotic|ampicillin|x-?gal|plate')],
     'Cut the plasmid and the DNA to be cloned with the same restriction enzyme so their sticky ends match; mix so the ends anneal, and seal the nicks with DNA ligase; transform bacteria (calcium chloride and heat shock, or electroporation); then plate on antibiotic (and X-gal) to select and identify recombinant colonies.', 5),
   text('Give the natural role of restriction enzymes and of DNA ligase in cells.', 2, [
     P('Restriction enzymes: bacterial defence (innate immunity) against bacteriophage DNA', [r'restriction', r'defen|immun|phage|virus']),
     P('Ligase: seals breaks in replication (Okazaki fragments), repair and recombination', [r'ligase', r'replicat|okazaki|repair|recombin|seal'])],
     'Restriction enzymes protect bacteria by cutting the DNA of invading phages (the host methylates its own sites). DNA ligase seals breaks during replication (joining Okazaki fragments), repair and recombination.', 3)),
 Q('A linear 10.0 kb fragment was cut with EcoRI, with BamHI, and with both. The fragments were separated on a gel.',
   num('How many kb apart are the EcoRI and BamHI sites?', 1.0, tol=0.05, unit='kb', working='EcoRI is 3.0 kb from one end and BamHI 4.0 kb (or 6.0 kb) from an end. The double digest 3.0 + 1.0 + 6.0 only fits BamHI 4.0 kb from the same end, so the sites are 1.0 kb apart.'),
   text('Explain why the double digest is needed to place the sites.', 2, [
     P('Single digests only give each site\'s distance from an end, not which end', [r'end|which', r'single|each|one enzyme|distance']),
     P('The double digest shows how the two sites lie relative to each other', r'relative|both|together|between|each other|order')],
     'A single digest tells you how far each site is from an end but not from which end. Only the double digest shows the sites\' positions relative to each other.', 2),
   text('Which fragments travel furthest through the gel, and why?', 2, [
     P('The smallest fragments', r'small|short'),
     P('DNA is negatively charged and moves to the positive electrode; small fragments pass through the agarose mesh more easily', r'negative|charge|positive|anode|mesh|pore|easier|faster')],
     'The smallest. DNA\'s phosphates make it negative, so it moves towards the positive electrode, and small fragments get through the gel\'s mesh fastest.', 2),
   table={'head': ['Digest', 'Fragments (kb)'], 'rows': [['uncut', '10.0'], ['EcoRI', '3.0 + 7.0'], ['BamHI', '4.0 + 6.0'], ['EcoRI + BamHI', '3.0 + 1.0 + 6.0']]}),
])

# ------------------------------------------------------------------ Lecture 10
L['l10'] = ('Polymerase Chain Reaction', 'Lecture 10', '01 Year 1/Molecular Biology and Genetics/Lectures/10 Polymerase Chain Reaction/Polymerase Chain Reaction (Lecture 10)', [
 Q('PCR amplifies a chosen region of DNA.',
   text('List the five components needed to set up a PCR.', 5, [
     P('Template DNA', r'template|target|sample dna'), P('Two primers (~20 nt oligonucleotides)', r'primer|oligo'),
     P('dNTPs (dATP, dCTP, dGTP, dTTP)', r'dntp|nucleotide|datp'), P('Buffer with Mg²⁺', r'mg|magnesium|buffer'),
     P('A thermostable DNA polymerase such as Taq', r'taq|thermostable|polymerase')],
     'Template DNA, two primers of about 20 nucleotides, the four dNTPs, a buffer containing Mg²⁺, and a thermostable DNA polymerase such as Taq.', 4),
   text('Describe the three steps of one PCR cycle, with temperatures.', 3, [
     P('Denaturation at 92–95 °C separates the strands', [r'denatur|separat|melt', r'9[0-9]']),
     P('Annealing at 50–65 °C: primers bind the complementary sequences', [r'anneal|bind|hybridi', r'[45][0-9]|60|65']),
     P('Extension at about 72 °C: polymerase extends the primers\' 3′ ends', [r'extend|extension|elongat|synthes', r'7[0-9]'])],
     'Denature at 92 to 95 °C to separate the strands; anneal at 50 to 65 °C so the primers bind; extend at about 72 °C as the polymerase adds nucleotides to each primer\'s 3′ end.', 4),
   text('Why must the polymerase be thermostable?', 2, [
     P('Each cycle heats to ~95 °C, which would denature an ordinary polymerase', r'9[0-9]|heat|high temp|denatur'),
     P('A thermostable enzyme (Taq, from Thermus aquaticus) survives, so it need not be re-added each cycle', r'surviv|stable|re-?add|every cycle|each cycle|taq|thermus|withstand')],
     'Every cycle heats the reaction to about 95 °C, which would denature most enzymes. Taq polymerase from <em>Thermus aquaticus</em> survives, so it does not have to be added again after each cycle.', 2)),
 Q('Designing primers for the PCR.',
   num('Calculate Tm for the primer 5′-AGCTTGCAGGCATCGAATCG-3′ using Tm = (4 × GC) + (2 × AT).', 62, tol=0.5, unit='°C', working='11 G or C and 9 A or T: (4 × 11) + (2 × 9) = 44 + 18 = 62 °C.'),
   num('What annealing temperature would you use?', 57, tol=1, unit='°C', working='Tm − 5 °C = 57 °C.'),
   text('Give two rules for designing a pair of PCR primers.', 2, [
     P('3′ ends point towards each other, one primer on each strand', r'3|toward|each other|face|opposite strand'),
     P('About 20 nt long, complementary to the flanking sequences', r'20|flank|complement'),
     P('Usually 500–5000 nt apart, with similar Tm', r'500|5000|apart|similar|tm')],
     'The primers bind opposite strands with their 3′ ends pointing towards each other across the target, typically 500 to 5000 nucleotides apart; each is about 20 nucleotides, complementary to a flanking sequence, with similar Tm.', 2)),
 Q('The number of copies grows each cycle.',
   num('Starting from 100 copies of a target, how many copies are there after 30 perfect cycles? (Give your answer like 1.07e11.)', 107374182400, rtol=0.03, working='100 × 2³⁰ = 100 × 1,073,741,824 ≈ 1.07 × 10¹¹.'),
   text('Explain why the real increase is less than double per cycle in later cycles.', 2, [
     P('Reagents (primers, dNTPs) run low', r'primer|dntp|reagent|run (low|out)|used up|deplet'),
     P('Polymerase loses activity / product strands re-anneal, so not every molecule is copied', r'activity|enzyme|polymerase|re-?anneal|not every|inefficien|product')],
     'Primers and dNTPs are used up, the polymerase gradually loses activity and product strands re-anneal to each other, so not every molecule is copied each cycle.', 2),
   text('A lab can use Taq or a high-fidelity polymerase. Which would you choose to clone a gene for protein expression, and why?', 2, [
     P('High-fidelity polymerase', r'high[- ]?fidelity|proofread|accurate'),
     P('Fewer errors, so the cloned sequence (and protein) is correct; accepting slower/dearer', r'error|mistake|correct|accura|mutation|slower|expensive|cost')],
     'A high-fidelity (proofreading) polymerase: it makes far fewer errors, so the cloned gene encodes the correct protein, even though it is slower and more expensive.', 2)),
 Q('PCR can also start from RNA and can be measured as it runs.',
   text('Explain how PCR can be used to measure the expression of a gene.', 3, [
     P('RNA is copied into cDNA by reverse transcriptase (RT-PCR)', r'reverse transcriptase|cdna|rt-?pcr'),
     P('Real-time (quantitative) PCR measures the product each cycle by fluorescence', r'real[- ]?time|qpcr|fluoresc'),
     P('More starting template (higher expression) gives a signal that rises in fewer cycles', r'earlier|fewer cycles|sooner|more (template|mrna|starting)|rise|higher')],
     'Reverse transcriptase copies the mRNA into cDNA, which is then amplified (RT-PCR). In real-time PCR a fluorescent dye or probe reports the amount of product after each cycle; a sample with more starting mRNA (higher expression) reaches the detectable signal in fewer cycles.', 4),
   mcq('Which is <strong>not</strong> a use of PCR described in the lecture?', ['Amplifying a gene to clone into an expression vector', 'Amplifying DNA before sequencing for diagnosis', 'Genetic fingerprinting for forensics', 'Cutting DNA at specific sequences'], 3,
       'Cutting DNA at specific sequences is what restriction enzymes do.')),
])

def Qi(img, stem, *parts):
    return Q(stem, *parts, img=img)

# ------------------------------------------------------------------ Lecture 11
L['l11'] = ('DNA Sequencing', 'Lecture 11', '01 Year 1/Molecular Biology and Genetics/Lectures/11 DNA Sequencing/DNA Sequencing (Lecture 11)', [
 Qi(A + 'mg11_s05.jpg', 'PCR can be used to measure how much of an RNA is present.',
   text('Explain how a TaqMan probe allows the amount of PCR product to be measured in real time.', 4, [
     P('The probe binds the target between the primers', r'bind|hybridi|anneal'),
     P('It carries a reporter dye and a quencher; while intact the quencher stops the reporter emitting', [r'reporter|dye|fluoro', r'quench']),
     P('The polymerase extending the primer cleaves the probe / releases the reporter', r'cleav|cut|degrad|releas|5.?nuclease|exonuclease'),
     P('Freed reporter fluoresces; the signal measured each cycle rises with the amount of product', r'fluoresc|light|emit|signal|each cycle|real[- ]?time|measur')],
     'The TaqMan probe hybridises to the target between the two primers. It carries a reporter dye and a quencher, and while the probe is intact the quencher stops the reporter fluorescing. As Taq polymerase extends the primer it reaches the probe and cleaves it, freeing the reporter from the quencher, so it fluoresces when excited. The fluorescence is measured each cycle and increases with the amount of PCR product.', 4),
   text('Why must the RNA first be treated with reverse transcriptase?', 1, [P('Taq/DNA polymerase needs a DNA template, so the RNA is copied into cDNA', r'cdna|copy|dna template|complementary dna|rna (in)?to dna')],
        'PCR uses a DNA polymerase, which copies DNA, so reverse transcriptase first copies the RNA into complementary DNA (cDNA).', 1),
   mcq('Who first developed DNA fingerprinting?', ['Kary Mullis', 'Fred Sanger', 'Alec Jeffreys', 'Craig Venter'], 2,
       'Prof Alec Jeffreys and colleagues at the University of Leicester, in the 1980s.')),
 Qi(A + 'mg11_s11.jpg', 'Sanger (dideoxy) sequencing was developed in 1977.',
   text('Explain why a dideoxynucleotide (ddNTP) stops DNA synthesis.', 2, [
     P('ddNTPs lack the 3′-OH group', r'3.?.?oh|3.?.?hydroxyl|no (3|hydroxyl|oh)|lack.*oh'),
     P('So the polymerase cannot form a phosphodiester bond to the next nucleotide', r'phosphodiester|next nucleotide|cannot (add|join|extend)|no further|chain terminat')],
     'A ddNTP has no hydroxyl group on its 3′ carbon. DNA polymerase adds each new nucleotide to the 3′-OH of the growing chain, so once a ddNTP is added no phosphodiester bond can be made to another nucleotide and the chain stops.', 2),
   text('Describe how automated Sanger sequencing determines the sequence of a DNA template.', 4, [
     P('A primer is annealed and DNA polymerase extends it with dNTPs', [r'primer', r'polymerase|extend|dntp']),
     P('Small amounts of the four ddNTPs, each labelled with a different fluorescent dye', [r'ddntp|dideoxy', r'fluoresc|dye|colou?r|label']),
     P('Chains stop at random positions, giving fragments ending at every base', r'every|each (position|base)|random|different length'),
     P('Fragments separated by size (capillary electrophoresis) and the colour order read from shortest to longest', r'capillary|electrophoresis|size|length|shortest|order')],
     'A primer is annealed to the template and extended by DNA polymerase with the four dNTPs plus small amounts of the four ddNTPs, each with a different fluorescent dye. Each chain stops wherever a ddNTP is incorporated, so fragments ending at every position are made. Capillary electrophoresis separates them by size, and a laser reads the colour of each fragment from shortest to longest, giving the sequence.', 4),
   num('Early automated sequencers ran 24 lanes of 200 bases. How many bases is that per run?', 4800, tol=0, unit='bases', working='24 × 200 = 4800, about 5000 bases per day.')),
 Q('The first draft human genome sequences were published in 2001.',
   text('Compare the strategies used by the public Human Genome Project and by Celera.', 3, [
     P('Public project (Francis Collins): hierarchical / BAC-by-BAC shotgun', [r'public|hgp|collins', r'bac|hierarch|map|clone by clone|ordered']),
     P('Overlapping BACs from a map were each shotgun sequenced', r'overlap|map|bac|each'),
     P('Celera (Craig Venter): whole-genome shotgun, random fragments of the whole genome assembled by computer', [r'celera|venter', r'whole[- ]genome|random|shotgun'])],
     'The public Human Genome Project, led by Francis Collins, used a hierarchical (BAC-by-BAC) shotgun approach: a minimal set of overlapping BAC clones was chosen from a map and each was shotgun sequenced. Celera, led by J. Craig Venter, used whole-genome shotgun sequencing, breaking the entire genome into random fragments and assembling the reads by computer.', 3),
   mcq('When was the finished human genome sequence completed?', ['1995', '2001', '2004', '2010'], 2, 'The draft came in 2001 and the finished sequence in 2004.')),
 Qi(A + 'mg11_s16.jpg', 'Next-generation sequencing (NGS) sequences millions of fragments in parallel.',
   text('Outline the steps of next-generation sequencing.', 4, [
     P('Genomic DNA is fragmented and a size class selected', r'fragment|break|shear|size'),
     P('Adapters are ligated to the ends of each fragment', r'adapt|ligat'),
     P('Fragments are immobilised on a surface and amplified by PCR (~1000 copies, clusters), with no in vivo cloning', r'immobil|surface|chip|bead|cluster|polony|amplif|pcr|1000'),
     P('Each is sequenced by synthesis, detecting the base added at each step', r'synthes|each step|cycle|detect|one (base|nucleotide)')],
     'Genomic DNA is fragmented and fragments of a chosen size selected. Adapters are ligated to each end. Without any in vivo cloning, the fragments are immobilised on a surface and amplified by PCR to about 1000 copies each. Every cluster is then sequenced by synthesis, the incorporated base being detected after each step.', 4),
   text('In pyrosequencing, explain how the incorporation of a nucleotide produces light.', 3, [
     P('Incorporation releases pyrophosphate (PPi)', r'pyrophosphate|ppi'),
     P('Sulfurylase converts the pyrophosphate into ATP', [r'sulfurylase|sulphurylase', r'atp']),
     P('Luciferase uses the ATP to oxidise luciferin, giving a flash of light', r'luciferase|luciferin')],
     'When a dNTP is incorporated, pyrophosphate is released. Sulfurylase converts the pyrophosphate into ATP, and luciferase uses that ATP to oxidise luciferin, producing a flash of light.', 3),
   text('In pyrosequencing, how would the trace show the sequence AA compared with A?', 1, [P('A flash about twice as bright in the same pulse', r'twice|double|2x|2 ?×|brighter|bigger')],
        'Both A residues are added during the same dATP pulse, giving a flash about twice as bright.', 1),
   text('In reversible terminator sequencing, why does each fluorescent nucleotide carry a removable blocking group?', 2, [
     P('So only one nucleotide is added per cycle', r'one (base|nucleotide)|single|per cycle|at a time'),
     P('After imaging the colour, the label and block are removed so the next nucleotide can be added', r'remov|cleav|unblock|next')],
     'The blocking group stops more than one nucleotide being added in a cycle. After the fluorescent colour has been recorded, both label and block are removed so the strand can be extended by the next nucleotide.', 2)),
 Q('DNA sequencing technology is still evolving.',
   text('Name four developments that made sequencing large genomes possible.', 4, [
     P('Pure DNA polymerases', r'polymerase|enzyme'), P('More sensitive detection of nucleic acids', r'sensitiv|detect|fluoresc'),
     P('Automated robotics', r'automat|robot'), P('Improved computer power', r'comput|software|bioinformatic')],
     'Production of pure DNA polymerases, increased sensitivity of nucleic acid detection, automated robotic technology and improved computer power.', 2),
   text('Give one advantage of nanopore sequencing over Illumina sequencing.', 1, [P('Very long reads / portable / single molecule with no amplification / detects methylation', r'long|portab|usb|small|single|no amplif|methyl|real[- ]?time|field')],
        'Nanopore reads are very long (up to hundreds of kb), come from single molecules without amplification, can detect methylation, and the devices are portable (as small as a USB stick).', 1),
   mcq('Which is <strong>not</strong> one of the uses of sequencing listed in the lecture summary?', ['De novo genome sequencing', 'Targeted re-sequencing', 'Transcriptome profiling', 'Cutting DNA at restriction sites'], 3,
       'The three uses given were de novo genome sequencing, targeted re-sequencing and transcriptome profiling.')),
])

# ------------------------------------------------------------------ Lectures 12 to 14
L['l12'] = ('Chromosomes and Genomes', 'Lectures 12 to 14', '01 Year 1/Molecular Biology and Genetics/Lectures/12 Chromosomes and Genomes/Chromosomes and Genomes (Lectures 12 to 14)', [
 Q('Prokaryotic and eukaryotic genetic material are organised differently.',
   text('Give three differences between the genome of <em>E. coli</em> and a eukaryotic nuclear genome.', 3, [
     P('E. coli: one circular chromosome; eukaryotes: several linear chromosomes', r'circular|linear|single|one chromosome|several|multiple'),
     P('E. coli genes tightly packed, on both strands, can overlap; eukaryotic genes spread out', r'tight|pack|overlap|both strands|dense|gene density|spread'),
     P('E. coli gene number correlates with genome size; eukaryotes mostly repetitive / non-coding DNA', r'repetit|non-?coding|correlat|2 ?%|junk'),
     P('E. coli compacted by supercoiling; eukaryotes by histones/nucleosomes', r'histone|nucleosome|supercoil|chromatin')],
     'E. coli has one circular chromosome (4.6 Mb), whereas eukaryotes have several linear chromosomes. Bacterial genes are tightly packed on both strands and can overlap, and gene number tracks genome size; most eukaryotic DNA is repetitive and non-coding (about 2% is genes in humans). Bacterial DNA is compacted by supercoiling; eukaryotic DNA is wrapped around histones as nucleosomes.', 3),
   num('The E. coli chromosome is 4,639,221 bp and has about 4300 genes. What is the average number of base pairs per gene? (Round to the nearest whole number.)', 1079, tol=2, unit='bp', working='4,639,221 ÷ 4300 ≈ 1079 bp per gene.'),
   text('The E. coli chromosome is about 1.2 mm long but the cell is about 1 µm long. How is the DNA compacted?', 1, [P('Supercoiling: the underwound circular DNA twists on itself', r'supercoil|coil|underwound|twist')],
        'By supercoiling: the circular DNA is underwound and twists on itself into compact supercoils.', 1)),
 Qi(A + 'mg12_s23.jpg', 'Eukaryotic DNA is packaged into chromatin.',
   text('Describe the structure of a nucleosome.', 3, [
     P('A histone octamer', r'octamer|eight'),
     P('Two copies each of H2A, H2B, H3 and H4', r'h2a|h2b|h3|h4'),
     P('About 147 bp of DNA wrapped around it; linker DNA with H1 between nucleosomes', r'147|wrap|wound|h1|linker')],
     'A nucleosome is a histone octamer, made of two copies each of H2A, H2B, H3 and H4, with 147 bp of DNA wrapped around it. Neighbouring nucleosomes are joined by linker DNA bound by histone H1.', 3),
   mcq('A chromosome with its centromere close to one end, giving a very short p arm, is described as:', ['Metacentric', 'Submetacentric', 'Acrocentric', 'Telocentric'], 2,
       'Acrocentric: close to the end. Telocentric is at the very end; metacentric in the middle; submetacentric between the middle and the end.'),
   text('What are telomeres?', 1, [P('The repetitive DNA at the ends of linear chromosomes', r'end|tip')], 'The repetitive DNA sequences at each end of a linear eukaryotic chromosome.', 1)),
 Q('Eukaryotic genomes vary hugely in size.',
   text('Explain what is meant by the C value paradox and why it occurs.', 3, [
     P('The C value is the DNA content of the haploid nuclear genome', [r'c ?value', r'haploid|dna content|amount']),
     P('Genome size does not correlate with complexity / gene number', r'not correlat|no correlat|complex|gene number|does not (match|reflect|track)'),
     P('Because most eukaryotic DNA is repetitive / non-coding', r'repetit|non-?coding|satellite|transposon|junk')],
     'The C value is the amount of DNA in the haploid nuclear genome. The paradox is that it does not correlate with the complexity or gene number of the organism (wheat has five times as much DNA as humans). This is because most eukaryotic DNA is repetitive, non-coding sequence.', 3),
   text('Distinguish between minisatellites, microsatellites and SINEs, giving an example of each.', 3, [
     P('Minisatellites (VNTRs): 1–5 kb tandem blocks of 15–100 bp units', r'vntr|15|100|minisatellite.*(tandem|repeat)'),
     P('Microsatellites (STRs): 2–5 bp motifs repeated 5–50 times, e.g. (CA)n', r'str|ca\)?n|2.?5 ?bp|\bca\b'),
     P('SINEs: short interspersed retrotransposons (< 500 bp), e.g. Alu', r'alu|interspersed|retrotranspos')],
     'Minisatellites (VNTRs) are tandem arrays 1–5 kb long of 15–100 bp units. Microsatellites (STRs) are 2–5 bp motifs repeated 5–50 times, such as (CA)n. SINEs are short (< 500 bp) interspersed retrotransposons, such as the ~300 bp Alu element with over a million copies in the human genome.', 3),
   num('Human functional genes make up about 2% of a 3.3 × 10⁹ bp haploid genome. How many base pairs is that? (Give your answer like 6.6e7.)', 6.6e7, rtol=0.02, unit='bp', working='0.02 × 3.3 × 10⁹ = 6.6 × 10⁷ bp.')),
 Q('Chromosome number varies between and within species.',
   num('A cell from a person with Down syndrome has trisomy 21. How many chromosomes does it contain?', 47, tol=0, working='2n + 1 = 46 + 1 = 47.'),
   text('Distinguish aneuploidy from polyploidy.', 2, [
     P('Aneuploidy: 2n plus or minus whole chromosomes (e.g. trisomy 2n + 1, monosomy 2n − 1)', r'2n ?[+±-]|plus or minus|monosom|trisom|extra (single )?chromosome|missing'),
     P('Polyploidy: more than two complete sets (3n, 4n …), a form of euploidy', r'3n|4n|complete set|whole set|multiple(s)? of n|euploid')],
     'Aneuploidy is having the diploid number plus or minus whole chromosomes, such as monosomy (2n − 1) or trisomy (2n + 1). Polyploidy is having more than two complete chromosome sets, such as triploidy (3n) or tetraploidy (4n); it is a type of euploidy.', 2),
   text('<em>Brassica napus</em> (AACC) arose from <em>B. rapa</em> (AA) and <em>B. oleracea</em> (CC). What type of polyploid is it?', 1, [P('Allopolyploid (amphidiploid): it combines different genomes', r'allo|amphidiploid')],
        'An allopolyploid (amphidiploid), because it contains the genomes of two different species.', 1)),
 Q('Human sex determination and dosage compensation.',
   text('Explain the evidence that SRY on the Y chromosome determines maleness.', 3, [
     P('Klinefelter (XXY) are male and Turner (X) female, so the Y decides', r'klinefelter|turner|xxy|45|47'),
     P('XY females have a Y lacking (deleted for) SRY', r'xy female|deleted|lack|missing|without sry'),
     P('XX mice transgenic for Sry develop as males', r'transgen|xx mice|mouse|mice')],
     'People with Klinefelter syndrome (47, XXY) are male and those with Turner syndrome (45, X) are female, so the Y chromosome determines maleness. XY females were found to have a Y chromosome deleted for SRY, and XX mice given an Sry transgene develop as males.', 3),
   text('What does SRY encode and what does it do?', 2, [
     P('Testis-determining factor (TDF)', r'tdf|testis[- ]determining'),
     P('Expressed at 6–8 weeks, it makes the undifferentiated gonads develop into testes', r'testes|testis|gonad')],
     'SRY encodes testis-determining factor (TDF), expressed from 6 to 8 weeks of development, which makes the undifferentiated gonadal tissue become testes.', 2),
   text('Describe how one X chromosome is inactivated in female cells, and explain why female mammals are mosaics.', 4, [
     P('Inactivation needs the X-inactivation centre (XIC)', r'xic|inactivation cent'),
     P('XIST is transcribed from the X to be inactivated', r'xist'),
     P('XIST RNA has no ORF / is not translated and coats the chromosome, which condenses into a Barr body', r'coat|bind|orf|non-?coding|barr|condens'),
     P('Which X is inactivated is random, early in development, and kept in daughter cells (Lyon hypothesis)', r'random|lyon|either|daughter|clon|patch|calico')],
     'Inactivation requires the X-inactivation centre (XIC). Its XIST gene is transcribed from the X that is to be silenced; the XIST RNA has no open reading frame and instead coats that chromosome, which becomes the condensed, inactive Barr body. Early in development each cell chooses at random which X to inactivate, and the choice is inherited by its descendants (the Lyon hypothesis), so females are mosaics of patches with different active X chromosomes, as seen in calico cats.', 4),
   num('How many Barr bodies would be found in a cell from a 47, XXY man?', 1, tol=0, working='Number of X chromosomes − 1 = 2 − 1 = 1.')),
 Q('Mutations create new alleles. Part of a coding sequence reads 5′-CAG GGC AAG GAT AGA-3′ (Gln Gly Lys Asp Arg).',
   mcq('The AAG codon (Lys) changes to TAG. What type of mutation is this?', ['Missense', 'Nonsense', 'Silent', 'Frameshift'], 1, 'TAG is a stop codon, so this is a nonsense mutation.'),
   mcq('An A → G change in AAG gives AGG (Arg). This is:', ['a transversion and a missense mutation', 'a transition and a missense mutation', 'a transition and a nonsense mutation', 'a transversion and a frameshift'], 1,
       'A → G is purine to purine (a transition), and it changes Lys to Arg (missense).'),
   text('A G is inserted after the 6th base (CAG GGG CAA GGA TAG A). Explain the effect on the protein.', 2, [
     P('The reading frame shifts so every codon after the insertion changes', r'frame|shift|read'),
     P('A premature stop codon (TAG) appears, truncating the protein', r'stop|tag|truncat|premature|shorter')],
     'The insertion is a frameshift: every codon after it is read in a new frame (Gln Gly Gln Gly), and a TAG stop codon soon appears, so the protein is truncated.', 2),
   text('Ras G12V is described as a gain-of-function mutation. Explain why it is oncogenic.', 3, [
     P('Ras is active with GTP bound and switches off by hydrolysing GTP (GTPase)', r'gtp|gtpase'),
     P('G12V lacks GTPase activity so it stays locked in the active form', r'lock|stay|always|permanent|constitut|cannot (switch|turn)|lack'),
     P('Continuous signalling causes uncontrolled cell division (cancer)', r'uncontrol|division|prolifer|cancer|tumou?r')],
     'Ras is active when GTP is bound and turns itself off by hydrolysing GTP to GDP. The G12V mutant lacks this GTPase activity, so it is locked in the active GTP-bound form and signals continuously, causing uncontrolled cell division.', 3)),
 Qi(A + 'mg12_s48.jpg', 'Gene duplication has been important in evolution.',
   text('Explain how gene duplication can lead to new genes, using the globins as an example.', 3, [
     P('Duplication (e.g. by unequal crossing over) makes two copies of a gene', r'unequal|crossing over|two copies|duplicat'),
     P('One copy keeps the original function while the other can mutate and gain a new function', r'new function|diverg|mutat|evolv|free'),
     P('Globins: one ancestral gene gave myoglobin, α- and β-globin clusters (e.g. fetal γ vs adult β)', r'myoglobin|alpha|α|beta|β|gamma|γ|fetal|globin')],
     'A duplication, for example by unequal crossing over, produces two copies of a gene. One copy keeps the original function, while the other is free to accumulate mutations and evolve a new one. Repeated duplications of an ancestral globin gene produced myoglobin and the α- and β-globin clusters, including fetal γ-globin and adult β-globin.', 3)),
])

# ------------------------------------------------------------------ Lecture 15
L['l15'] = ('DNA Damage and Repair', 'Lecture 15', '01 Year 1/Molecular Biology and Genetics/Lectures/15 DNA Damage and Repair/DNA Damage and Repair (Lecture 15)', [
 Q('DNA is damaged all the time, from inside and outside the cell.',
   text('Distinguish between endogenous and exogenous DNA damage, giving two causes of each.', 4, [
     P('Endogenous damage comes from inside the cell', [r'endogen', r'inside|within|internal|cell itself']),
     P('Endogenous causes: oxygen free radicals / replication errors', r'radical|reactive oxygen|ros|hydroxyl|replication|metabol'),
     P('Exogenous damage comes from outside the cell', [r'exogen', r'outside|external|environment']),
     P('Exogenous causes: ionising radiation, UV, environmental chemicals', r'ionis|ioniz|x-?ray|gamma|uv|ultraviolet|chemical|mutagen')],
     'Endogenous damage arises inside the cell, for example from oxygen free radicals made by metabolism or from errors during replication. Exogenous damage comes from outside the cell, for example ionising radiation, UV light and chemicals in the environment.', 4),
   mcq('Which is the most reactive oxygen radical in biological systems?', ['Superoxide (O₂·⁻)', 'Hydrogen peroxide (H₂O₂)', 'Hydroxyl radical (HO·)', 'Singlet oxygen'], 2,
       'The hydroxyl radical, HO·, is by far the most reactive. It attacks the C4–C5 double bond of pyrimidines in particular.')),
 Qi(A + 'mg15_s07.jpg', 'Oxidative and spontaneous damage change the chemistry of DNA.',
   text('Describe what happens in depurination and in the deamination of cytosine.', 4, [
     P('Depurination: the glycosidic bond between the sugar and a purine (A or G) is broken', [r'glycosid|n-glycosyl|bond', r'purine|guanine|adenine|\bg\b|\ba\b']),
     P('This leaves a sugar with no base (abasic / depurinated site)', r'no base|abasic|ap site|missing base|without (a|its) base|depurinated sugar|empty'),
     P('Deamination removes the amino group from cytosine', r'amino|nh|amine'),
     P('Cytosine becomes uracil', r'uracil')],
     'In depurination water breaks the glycosidic bond linking a purine (A or G) to deoxyribose, leaving a depurinated sugar with no base. In deamination the amino group of cytosine is removed, turning it into uracil.', 4),
   text('Explain why the deamination of cytosine leads to a mutation if it is not repaired.', 2, [
     P('Uracil pairs with adenine (not guanine)', [r'uracil|\bu\b', r'adenine|\ba\b|pairs with a']),
     P('After replication the original C–G pair becomes T–A (U–A)', r't-?a|a-?t|u-?a|c-?g.*(t|a)|transition|substitut|change')],
     'Uracil base-pairs with adenine. When the strand is copied, an A is placed opposite the U, and in the next round a T opposite that A, so the original C–G base pair becomes T–A.', 2),
   text('Why is a double strand break more dangerous than a single strand break?', 2, [
     P('Both strands are broken', r'both|two strands'),
     P('No intact complementary strand to use as a template / chromosome can be broken or lost', r'no (intact|undamaged)|template|complement|chromosome|lost|fragment')],
     'In a double strand break both backbones are cut, so there is no intact complementary strand left to act as a template, and the chromosome can be broken apart or rearranged.', 2)),
 Qi(A + 'mg15_s09.jpg', 'UV light damages DNA.',
   text('Describe the damage UV light causes in DNA and its effect on the double helix.', 3, [
     P('Adjacent pyrimidines (usually thymines) on the same strand', r'adjacent|neighbou?r|next to|same strand|consecutive'),
     P('Are covalently crosslinked into a pyrimidine (thymine) dimer: cyclobutane dimer or 6-4 photoproduct', r'dimer|crosslink|cross-link|cyclobutane|6-?4'),
     P('This kinks/distorts the helix, blocking replication and transcription', r'kink|distort|bend|block|stall')],
     'UV light covalently links two adjacent pyrimidines on the same strand, usually two thymines, into a pyrimidine dimer: either a cyclobutane dimer (C5–C5 and C6–C6 bonds) or a 6-4 photoproduct. The dimer kinks and distorts the helix, which blocks replication and transcription.', 3),
   text('Describe how photolyase repairs a thymine dimer.', 4, [
     P('Photolyase binds the dimer and flips it into its active site', r'flip|bind|active site|pocket'),
     P('5,10-MTHF absorbs a photon of blue light', r'mthf|methenyl|blue|photon|light'),
     P('Energy passes to FADH⁻, which transfers an electron to the dimer', r'fadh|flavin|electron'),
     P('The dimer is split back into two pyrimidines and FADH⁻ is regenerated', r'split|cleav|break|separat|regenerat|monomer')],
     'Photolyase binds the DNA and flips the dimer into its active site. Its cofactor 5,10-MTHF absorbs a photon of blue light and passes the energy to FADH⁻. The excited FADH⁻ gives an electron to the dimer, splitting it back into two separate pyrimidines, and the electron returns to the flavin, regenerating FADH⁻.', 4),
   mcq('Which statement about photoreactivation is correct?', ['It needs several proteins working together', 'It removes a 29-nucleotide stretch of DNA', 'It does not occur in placental mammals such as humans', 'It works in the dark'], 2,
       'Photolyase is a single protein, does not remove nucleotides and needs blue light. It is found in many prokaryotes and eukaryotes but not in placental mammals.')),
 Qi(A + 'mg15_s15.jpg', 'Humans repair thymine dimers by nucleotide excision repair (NER).',
   text('Outline the steps of nucleotide excision repair.', 4, [
     P('An excinuclease cuts the damaged strand on both sides of the lesion', r'excinuclease|nuclease|cut|incis|nick'),
     P('DNA helicase removes the damaged oligonucleotide', r'helicase|remov|excis|oligo'),
     P('DNA polymerase fills the gap using the undamaged strand as template', [r'polymerase|fill|synthes', r'template|undamaged|other strand|complement|gap']),
     P('DNA ligase seals the nick', r'ligase|seal|join')],
     'An excinuclease cuts the damaged strand on both sides of the lesion. DNA helicase removes the damaged oligonucleotide. DNA polymerase (I in E. coli, ε in humans) fills the gap by copying the undamaged strand, and DNA ligase seals the remaining nick.', 4),
   num('How many nucleotides long is the fragment removed by NER in humans?', 29, tol=0, unit='nt', working='29 nucleotides in humans; 13 in E. coli.'),
   text('Explain why patients with xeroderma pigmentosum develop skin cancers.', 2, [
     P('Their nucleotide excision repair is defective', r'ner|nucleotide excision|excision repair|repair'),
     P('UV damage (pyrimidine dimers) is not repaired, so mutations build up and cause cancer', r'uv|sun|dimer|mutation|accumulat|build')],
     'XP is a defect in nucleotide excision repair. Pyrimidine dimers made by UV in sunlight cannot be removed, so mutations build up in skin cells and lead to skin cancer.', 2)),
 Qi(A + 'mg15_s19.jpg', 'Mismatch repair (MMR) corrects replication errors in <em>E. coli</em>.',
   text('Explain how the MMR system recognises which strand contains the error.', 3, [
     P('Dam methylase methylates the A in GATC sequences', r'dam|methyl', ),
     P('Just after replication only the template strand is methylated (hemimethylated)', r'hemimethyl|template.*methyl|only one strand|parent'),
     P('The unmethylated strand is the new strand, so it must hold the error', r'unmethylated|new|daughter|newly')],
     'Dam methylase methylates the A in every GATC. For a short time after replication only the template strand is methylated (the DNA is hemimethylated), so the unmethylated strand must be the new strand, and that is the one carrying the wrong base.', 3),
   text('Describe the roles of MutS, MutL and MutH.', 3, [
     P('MutS binds the mismatch', [r'muts', r'bind|recogn|find|detect']),
     P('MutL binds MutS; the DNA is threaded/looped through the complex', [r'mutl', r'muts|complex|thread|loop|join|bind']),
     P('MutH cuts the unmethylated strand at the hemimethylated GATC', [r'muth', r'cut|cleav|nick|incis'])],
     'MutS binds the mismatched base pair and MutL binds MutS; DNA is threaded through the MutS–MutL complex in both directions. When it meets MutH bound at a hemimethylated GATC, MutH cuts the unmethylated (new) strand 5′ of the G in GATC.', 3),
   text('After MutH cuts, how is the repair completed?', 2, [
     P('Helicase II and an exonuclease remove the new strand from the cut to past the mismatch', r'exonuclease|helicase|remov|degrad|digest'),
     P('DNA polymerase III fills the gap and DNA ligase seals it', r'polymerase|ligase|fill|seal')],
     'DNA helicase II unwinds and an exonuclease removes the new strand from the cut to beyond the mismatch. DNA polymerase III (with SSB) resynthesises the stretch and DNA ligase seals the nick.', 2)),
 Q('Defects in DNA repair cause human disease.',
   mcq('Hereditary non-polyposis colorectal cancer (HNPCC) is caused by defects in which pathway?', ['Nucleotide excision repair', 'Mismatch repair', 'Homologous recombination', 'Photoreactivation'], 1,
       'HNPCC (and Turcot syndrome) are mismatch repair defects.'),
   mcq('Mutations in BRCA1 and BRCA2 predispose to breast and ovarian cancer. Which repair pathway do they act in?', ['Mismatch repair', 'Base excision repair', 'Homologous recombination', 'Nucleotide excision repair'], 2,
       'BRCA1 and BRCA2 work in homologous recombination, which repairs double strand breaks.'),
   mcq('Which syndrome has defective NER but <strong>no</strong> cancer predisposition?', ['Xeroderma pigmentosum', 'Cockayne syndrome', 'Bloom syndrome', 'Ataxia-telangiectasia'], 1,
       'Cockayne syndrome and trichothiodystrophy are NER defects with photosensitivity and developmental problems but no cancer predisposition.')),
])

# ------------------------------------------------------------------ Practicals
L['pr'] = ('Practicals', 'Practicals 1 to 3', '01 Year 1/Molecular Biology and Genetics/Molecular Biology and Genetics', [
 Q('Practical 1. A standard curve of absorbance at 260 nm against DNA concentration had the equation A = 0.020C + 0.005 (C in µg/mL, R² = 0.996). The unknown was diluted by adding 50 µL to 950 µL of TE buffer, and the diluted sample read A = 0.245.',
   num('Calculate the DNA concentration of the diluted sample.', 12, tol=0.1, unit='µg/mL', working='(0.245 − 0.005) ÷ 0.020 = 12 µg/mL.'),
   num('Calculate the concentration of the original undiluted sample.', 240, tol=1, unit='µg/mL', working='50 µL in 1000 µL is a 1 in 20 dilution: 12 × 20 = 240 µg/mL.'),
   text('What does R² = 0.996 tell you?', 1, [P('The data fit the straight line very closely (strongly linear)', r'fit|linear|close to 1|straight|good|reliab|correlat')],
        'The points lie very close to the straight line: a strong linear fit.', 1),
   text('Why is the spectrophotometer zeroed with a tube of buffer only, and what do Tris and EDTA do in TE buffer?', 3, [
     P('The buffer-only blank removes the background absorbance of the buffer and cuvette', r'blank|zero|baseline|background|buffer only|no dna'),
     P('Tris keeps the pH stable', [r'tris', r'ph']),
     P('EDTA binds metal ions that DNA-degrading enzymes need, protecting the DNA', [r'edta', r'metal|ion|mg|chelat|nuclease|degrad|protect'])],
     'The blank contains everything except DNA, so zeroing on it removes the background absorbance. Tris keeps the pH stable; EDTA binds the metal ions (e.g. Mg²⁺) that DNA-degrading enzymes need.', 3)),
 Q('Practical 2. A 5000 bp circular plasmid was cut with enzymes X, Y and Z. X is placed at position 0.',
   num('Each single digest gave one 5000 bp fragment. How many sites does each enzyme have?', 1, working='Cutting a circle once just opens it into one linear fragment.'),
   num('From the X + Y and X + Z digests, Y is at 1500. Use the Y + Z digest to give the position of Z (in bp from X, going the same way round).', 2000, tol=1, unit='bp',
       working='X + Z puts Z at 2000 or 3000. Y + Z = 500 + 4500 means Y and Z are 500 bp apart, so Z is at 2000 (at 3000 it would be 1500 bp from Y).'),
   text('Predict the fragments from the triple digest X + Y + Z.', 2, [
     P('1500 bp (X to Y) and 500 bp (Y to Z)', [r'1500|1\.5', r'\b500\b|0\.5 ?kb']),
     P('3000 bp (Z back to X)', r'3000|3\.0 ?kb|3 ?kb')],
     '1500 bp (0 to 1500), 500 bp (1500 to 2000) and 3000 bp (2000 back round to 5000/0).', 3),
   table={'head': ['Digest', 'Fragments (bp)'], 'rows': [['X', '5000'], ['Y', '5000'], ['Z', '5000'], ['X + Y', '1500 + 3500'], ['X + Z', '2000 + 3000'], ['Y + Z', '500 + 4500']]}),
 Q('Practical 3. <em>E. coli</em> HB101 was transformed with pBR322. 100 µL samples were spread on plates. The 10⁻⁶ dilution of the starting cells gave 45 colonies on LB agar. The undiluted transformation mix gave 120 colonies on LB + ampicillin.',
   num('Calculate the total number of viable cells per mL (CFU/mL). (Give answers like 4.5e8.)', 4.5e8, rtol=0.02, unit='CFU/mL', working='45 × 10⁶ × 10 = 4.5 × 10⁸ CFU/mL.'),
   num('Calculate the transformed cells per mL.', 1200, rtol=0.02, unit='CFU/mL', working='120 × 10⁰ × 10 = 1.2 × 10³ CFU/mL.'),
   num('Calculate the frequency of transformation.', 2.67e-6, rtol=0.05, working='1.2 × 10³ ÷ 4.5 × 10⁸ = 2.7 × 10⁻⁶ (about 1 cell in 375,000).'),
   text('Explain why the cells recover in LB broth at 37 °C before plating on ampicillin, and why untransformed cells are also plated on ampicillin.', 2, [
     P('Recovery lets the ampicillin-resistance (bla) gene be expressed before the cells meet the antibiotic', [r'recover|express|time', r'resist|bla|amp|gene|enzyme|protein']),
     P('The control shows the cells were not already resistant, so growth on the test plate is due to the plasmid', r'control|already|not resistant|untransformed|plasmid|no growth')],
     'Recovery gives transformed cells time to express the plasmid\'s ampicillin-resistance gene before meeting the antibiotic. Untransformed cells on ampicillin should not grow, confirming that any growth on the test plate comes from the plasmid.', 2)),
])

ORDER = ['l1', 'l2', 'l3', 'l5', 'l6', 'l7', 'l8', 'l10', 'l11', 'l12', 'l15', 'pr']


def build():
    import sys
    sys.path.insert(0, HERE)
    from make_datatest import papers as data_papers
    papers = data_papers()
    from make_example import paper as example_paper
    papers.insert(0, example_paper())
    for P in papers:
        for i, q in enumerate(P['questions']):
            q['id'] = f"{P['id']}-q{i + 1}"
            for j, p in enumerate(q['parts']):
                p['id'] = f"{P['id']}-q{i + 1}{'abcdefgh'[j]}"
    for key in ORDER:
        title, lec, hub, qs = L[key]
        for i, q in enumerate(qs):
            q['id'] = f'{key}-q{i + 1}'
            for j, p in enumerate(q['parts']):
                p['id'] = f'{key}-q{i + 1}{"abcdefgh"[j]}'
        total = sum(p['marks'] for q in qs for p in q['parts'])
        papers.append({'id': 'gen-' + key, 'title': title, 'lecture': lec, 'hub': hub, 'marks': total, 'questions': qs})
    out = {'subject': 'Molecular Biology and Genetics', 'module': 'BIO-4018A', 'papers': papers}
    json.dump(out, open(os.path.join(HERE, 'molecular-biology-and-genetics.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for p in papers:
        print(f"{p['lecture']:<18} {p['title']:<32} {len(p['questions']):>2} questions {p['marks']:>3} marks")


if __name__ == '__main__':
    build()
