---
title: "How Sanger sequencing works"
aliases: ["How Sanger sequencing works"]
tags: [genetics, topic]
type: topic
subject: Molecular Biology and Genetics
part_of: "DNA Sequencing (Lecture 11)"
kind: lecture
semester: Autumn
summary: "DNA polymerase copies the template; chain-terminating ddNTPs stop synthesis at every position"
source: "Lecture 11: DNA Sequencing, Prof Richard Bowater (PowerPoint)"
cssclasses: [subject-genetics, page-topic]
created: 2026-11-04
updated: 2026-11-04
---
# How Sanger sequencing works

> [!path] [[Molecular Biology and Genetics]] › [[DNA Sequencing (Lecture 11)]]

*Source: Lecture 11: DNA Sequencing, Prof Richard Bowater (PowerPoint), slides 11-12*

- The major advance in DNA sequencing came from using **DNA polymerases**
- DNA synthesis needs a **template strand**, a **primer** and **dNTPs**; each new nucleotide joins to the **3′-OH** of the growing strand
- **Fred Sanger** used **[[Dideoxynucleotide|dideoxynucleotides (ddNTPs)]]**: these lack the 3′-OH, so once one is added **no further nucleotide can join** and synthesis stops

## How [[Sanger sequencing]] works
1. A primer is annealed next to the DNA to be sequenced
2. DNA polymerase extends it using normal **dNTPs** plus **small amounts of ddNTPs**
3. Each strand stops wherever a ddNTP happens to be added, so you get fragments ending at **every position**
4. The fragments are separated by size (originally on gels, later by **capillary electrophoresis**); in automated sequencing each ddNTP carries a **different fluorescent dye**, so the order of colours from shortest to longest gives the sequence

## Improved DNA sequencing
- Basic **dideoxynucleotide termination** chemistry developed in **1977**
- First **automated** systems available about **1990**
- **24 lanes × 200 bases**: about **5000 bases per day**
- Continuous development **1990 to 2004**
- Genomes completed: *H. influenzae* (1995), *S. cerevisiae* (1996), *E. coli* (1997), *C. elegans* (1998), *D. melanogaster* (2000), human draft (2001), *M. musculus* (2002), human completed (2003 to 2004)

> [!quote] Shendure et al. (2017) Nature
> Sanger's method involved four extensions of a labelled primer by DNA polymerase, each with trace amounts of one chain-terminating nucleotide, to produce fragments of different lengths.

> [!quote] Shendure et al. (2017) Nature
> Shotgun sequencing—sequencing of random clones followed by sequence assembly based on the overlaps—was suggested by Staden in 1979.

> [!figure] Synthesis needs a template, a primer and dNTPs; ddNTPs interrupt it (Lecture 11, slide 11)
> ![[mg11_s11.jpg]]

> [!figure] Genome sequencing timeline, 1990 to 2004 (Lecture 11, slide 12)
> ![[mg11_s12.jpg]]

## Questions
> [!question]- Why does adding a ddNTP stop DNA synthesis?
> A ddNTP has no 3′-OH group, so DNA polymerase cannot join the next nucleotide to it.

> [!question]- What three things does DNA synthesis need?
> A template strand, a primer and dNTPs (plus DNA polymerase).

> [!question]- In Sanger sequencing, why are only small amounts of ddNTPs added?
> So that each strand stops at a random point, giving fragments that end at every position rather than all stopping at the first base.

> [!question]- When was dideoxy sequencing developed, and when did automated systems appear?
> 1977; automated systems about 1990.

> [!question]- How fast were the first automated sequencers?
> 24 lanes × 200 bases, about 5000 bases per day.
