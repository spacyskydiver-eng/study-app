---
title: "Third-generation and the future of sequencing"
aliases: ["Third-generation and the future of sequencing"]
tags: [genetics, topic]
type: topic
subject: Molecular Biology and Genetics
part_of: "DNA Sequencing (Lecture 11)"
kind: lecture
semester: Autumn
summary: "Single-molecule real-time sequencing (PacBio, nanopore) and the applications driving demand"
source: "Lecture 11: DNA Sequencing, Prof Richard Bowater (PowerPoint)"
cssclasses: [subject-genetics, page-topic]
created: 2026-11-04
updated: 2026-11-04
---
# Third-generation and the future of sequencing

> [!path] [[Molecular Biology and Genetics]] › [[DNA Sequencing (Lecture 11)]]

*Source: Lecture 11: DNA Sequencing, Prof Richard Bowater (PowerPoint), slides papers*

*Source: the two Nature (October 2017) papers set as reading: Shendure et al., "DNA sequencing at 40", and Green, Rubin and Olson, "The future of DNA sequencing"*

## Three generations

| Generation | Examples | Key features |
| --- | --- | --- |
| **First** | Maxam–Gilbert and **Sanger** (1977) | fragments separated by size; Sanger dominated by 1985 |
| **Second (NGS)** | **454** pyrosequencing (2005), **Solexa/Illumina** reversible terminators | massively parallel, amplified clusters, short reads (low hundreds of bases), over 99.9% accurate |
| **Third** | **PacBio**, **Oxford Nanopore** | **real-time, single-molecule**, no amplification, very long reads |

## Single-molecule sequencing
- **PacBio**: watches a single polymerase add fluorescent nucleotides inside a tiny well (a zero-mode waveguide). Reads are typically **over 10 kb**, but errors are high (**about 10%**, randomly spread)
- **[[Nanopore sequencing]]** (Oxford Nanopore): single-stranded DNA passes through a **protein pore** and the change in **ion flow** reveals the sequence. Reads up to about **900 kb**, and devices can be as small as a **USB stick**
- Both can detect **DNA modifications such as methylation**, which amplification loses

## Uses and the future
- Sequencing is used for **de novo genome sequencing**, **targeted re-sequencing** and **transcriptome profiling**
- Green, Rubin and Olson argue that future trends will be driven by **killer applications, not killer technologies**: cheaper sequencing increases demand
- **Medicine**: non-invasive **prenatal testing** for trisomy 21 using cell-free fetal DNA in the mother's blood (4 to 6 million tests a year), diagnosing children with unexplained congenital conditions (about **30%** solved), **liquid biopsies** for cancer
- **Portable sequencers** for field epidemiology and testing food and water

> [!quote] Shendure et al. (2017) Nature
> Over a billion independent reads, totalling a terabase of sequence, can be generated in two days by one graduate student on one instrument (Illumina NovaSeq) for a few thousand dollars.

> [!quote] Green, Rubin and Olson (2017) Nature
> Our central message is that trends in DNA sequencing will be driven by killer applications, not by killer technologies.

## Questions
> [!question]- What are the three generations of DNA sequencing, with an example of each?
> First: Sanger (or Maxam–Gilbert); second (NGS): 454 pyrosequencing or Illumina; third (single-molecule, real-time): PacBio or Oxford Nanopore.

> [!question]- How does nanopore sequencing read DNA?
> Single-stranded DNA is passed through a protein nanopore and changes in the flow of ions through the pore reveal the base sequence.

> [!question]- Give one advantage and one disadvantage of PacBio single-molecule sequencing compared with Illumina.
> Advantage: very long reads (over 10 kb), no amplification bias, can detect methylation. Disadvantage: high error rate (~10%) and lower throughput.

> [!question]- Give a clinical application of DNA sequencing described by Green, Rubin and Olson.
> Non-invasive prenatal testing for trisomy 21 using cell-free fetal DNA in maternal blood (also diagnosing congenital conditions and liquid biopsies for cancer).
