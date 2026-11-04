"""The official example In-Class Data Analysis Test (BIO-4018A), with the module's own answers and explanations.
The real test (9 Nov) has the same format: 10 MCQs, 2 marks each, 40 minutes, calculator allowed, no notes.
Imported by make_genetics.py."""
IMG = 'assets/exam-img/'


def mcq(stem, options, answer, explain):
    return {'type': 'mcq', 'stem': stem, 'options': options, 'answer': answer, 'explain': explain, 'marks': 2}


def paper():
    g = IMG + 'example_fig1.png'
    qs = [
        {'stem': '<strong>Figure 1.</strong> Restriction enzyme digest of plasmid pBR322. Lanes 1 and 9: 1 kb ladder. Lane 2 HindIII; Lane 3 PstI; Lane 4 PvuII; Lane 5 HindIII + PstI; Lane 6 HindIII + PvuII; Lane 7 PstI + PvuII; Lane 8 HindIII + PstI + PvuII.', 'img': g, 'parts': [
            mcq('How many HindIII sites are there in plasmid pBR322?', ['0', '1', '2', '3', '4'], 1,
                'Plasmids are circular. Cutting a plasmid once produces one fragment, which is what lane 2 (HindIII) shows.'),
            mcq('How many PstI sites are there in plasmid pBR322?', ['0', '1', '2', '3', '4'], 1,
                'Lane 3 (PstI) shows one fragment, so PstI cuts the circle once.'),
            mcq('What is the approximate size of pBR322?', ['1300 bp', '2300 bp', '3300 bp', '4300 bp', '5300 bp'], 3,
                'The single bands in lanes 2, 3 and 4 lie between the 4000 and 5000 bp markers.'),
            mcq('The shortest distance between the HindIII and PvuII sites is approximately:', ['75 bp', '800 bp', '2000 bp', '2300 bp', '20,000 bp'], 2,
                f'There is one HindIII and one PvuII site, so cutting with both (lane 6) gives two fragments. The smaller one, about 2000 bp, is the shortest distance between them.<img src="{IMG}example_fig2.png" alt="Map of the HindIII and PvuII sites" style="max-width:100%;margin-top:8px">'),
            mcq('The smallest fragment in lane 8 was produced by digestion with which enzyme(s)?', ['HindIII alone', 'HindIII and PstI', 'HindIII and PvuII', 'PstI and PvuII', 'Taq polymerase'], 1,
                f'Lane 5 (HindIII + PstI) has the same small fragment (about 750 bp), so it has a HindIII site at one end and a PstI site at the other.<img src="{IMG}example_fig3.png" alt="Map of the three sites" style="max-width:100%;margin-top:8px">'),
        ]},
        {'stem': 'HindIII cuts double-stranded DNA.', 'parts': [
            mcq('The recognition site for HindIII on one strand is 5′-AAGCTT-3′. What is the sequence of the site on the other strand?', ['5′-TTCGAA-3′', '5′-CTGCAG-3′', '5′-CAGCTG-3′', '5′-AAGCTT-3′', '5′-GAATTC-3′'], 3,
                'Recognition sites like this are palindromic (dyad symmetry): both strands read the same 5′ to 3′. 5′-AAGCTT-3′ pairs with 3′-TTCGAA-5′, which read 5′ to 3′ is AAGCTT.'),
        ]},
        {'stem': '<strong>Figure 2.</strong> Restriction map of plasmid pBR322 (4361 bp), showing the sites for AhdI, BsaI, BamHI, EcoRI, EcoRV, NheI, ScaI and StyI.', 'img': IMG + 'example_fig4.png', 'parts': [
            mcq('You wish to isolate the whole of the tetracycline resistance gene (TcR) on the smallest fragment possible. Which pair of enzymes should you use?', ['ScaI and BamHI', 'AhdI and EcoRI', 'EcoRI and EcoRV', 'EcoRI and StyI', 'BamHI and StyI'], 3,
                'EcoRI (4359) sits just before the start of TcR and StyI (1369) just after its end. The other pairs either cut inside TcR (BamHI, EcoRV) or give a larger fragment.'),
        ]},
        {'stem': '<strong>Figure 3.</strong> Absorbance of DNA solutions of different concentrations. Trend line y = 23.272x − 0.0007.', 'img': IMG + 'example_fig5.png', 'parts': [
            mcq('What absorbance would you expect for a DNA solution of 0.05 mg/mL?', ['0.92', '1.04', '1.16', '1.28', '1.65'], 2,
                'Use the equation, not the graph: the options are too close to read off. y = (23.272 × 0.05) − 0.0007 = 1.16.'),
            mcq('What DNA concentration would you expect to give an absorbance of 1.50?', ['0.059', '0.062', '0.064', '0.066', '0.068'], 2,
                'Rearrange to make x the subject: x = (y + 0.0007) ÷ 23.272 = (1.50 + 0.0007) ÷ 23.272 = 0.064 mg/mL.'),
            mcq('What is the R² value?', ['0.0', '0.1 to 0.5', '0.5 to 0.9', 'Greater than 0.9 but less than 1.0', '1.0'], 3,
                'A perfect straight line has R² = 1.0. The points lie very close to the straight trend line, so R² is close to 1 (it is actually 0.984).'),
        ]},
    ]
    for i, q in enumerate(qs):
        q['id'] = f'dat-ex-q{i + 1}'
        for j, p in enumerate(q['parts']):
            p['id'] = f'dat-ex-q{i + 1}{"abcdefgh"[j]}'
    return {'id': 'dat-ex', 'title': 'Official example test (with the module\'s answers)', 'lecture': 'In-class test (9 Nov)',
            'hub': '01 Year 1/Molecular Biology and Genetics/Molecular Biology and Genetics',
            'marks': sum(p['marks'] for q in qs for p in q['parts']), 'questions': qs}
