---
title: "How next-generation sequencing works"
aliases: ["How next-generation sequencing works"]
tags: [genetics, topic]
type: topic
subject: Molecular Biology and Genetics
part_of: "DNA Sequencing (Lecture 11)"
kind: lecture
semester: Autumn
summary: "Fragments with adapters are amplified on a surface and sequenced by synthesis, millions at once"
source: "Lecture 11: DNA Sequencing, Prof Richard Bowater (PowerPoint)"
cssclasses: [subject-genetics, page-topic]
created: 2026-11-04
updated: 2026-11-04
---
# How next-generation sequencing works

> [!path] [[Molecular Biology and Genetics]] › [[DNA Sequencing (Lecture 11)]]

*Source: Lecture 11: DNA Sequencing, Prof Richard Bowater (PowerPoint), slides 16-17, 20*

**[[Next-generation sequencing]] (NGS)** steps:
1. **Genomic DNA is fragmented** and specific size classes are selected
2. **Adapter sequences** are ligated to each end of each fragment (in vitro)
3. **No conventional (in vivo) cloning** of fragments is needed
4. Fragments are **immobilised on a solid surface** and **PCR makes about 1000 copies** of each (a cluster or "polony")
5. Each template is sequenced **step by step by chemical synthesis**
6. The incorporated base is **detected after each step**, and the sequence is built up

- The full genome is immobilised on a chip in fragments **a few hundred bases long**, and **all are sequenced at once**, so detection is much faster (over 10⁶ reads per array)
- Two methods: **pyrosequencing** and **reversible terminator sequencing**
- Animations: STEM Learning, "Genetics and biotechnology" collection

> [!quote] Shendure et al. (2017) Nature
> Instead of one tube per reaction, a complex library of DNA templates is densely immobilized onto a two-dimensional surface, with all templates accessible to a single reagent volume.

> [!figure] NGS: fragmentation, adapter ligation, polony array, cyclic array sequencing (Lecture 11, slide 16)
> ![[mg11_s16.jpg]]

## Questions
> [!question]- Outline the main steps of next-generation sequencing.
> Fragment the genomic DNA and select a size; ligate adapters to each end; immobilise on a surface and amplify each fragment by PCR (~1000 copies); sequence each by synthesis, detecting the base added at each step.

> [!question]- What is the key difference between NGS and Sanger sequencing?
> NGS sequences millions of fragments at once (massively parallel) on a surface by synthesis, with no in vivo cloning, instead of one reaction per tube separated by size.

> [!question]- Why are adapters ligated to the fragments in NGS?
> They give every fragment the same known ends, so the fragments can be attached to the surface and primed for amplification and sequencing.
