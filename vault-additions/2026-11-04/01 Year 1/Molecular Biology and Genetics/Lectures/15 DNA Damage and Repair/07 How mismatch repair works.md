---
title: "How mismatch repair works"
aliases: ["How mismatch repair works"]
tags: [genetics, topic]
type: topic
subject: Molecular Biology and Genetics
part_of: "DNA Damage and Repair (Lecture 15)"
kind: lecture
semester: Autumn
summary: "MutS, MutL and MutH remove a stretch of the new strand, identified because it is not yet methylated"
source: "Lecture 15: DNA damage and repair (PowerPoint)"
cssclasses: [subject-genetics, page-topic]
created: 2026-11-04
updated: 2026-11-04
---
# How mismatch repair works

> [!path] [[Molecular Biology and Genetics]] › [[DNA Damage and Repair (Lecture 15)]]

*Source: Lecture 15: DNA damage and repair (PowerPoint), slides 18-20*

**[[Mismatch repair]] (MMR)** fixes replication errors. It must know **which strand is new** (the one with the error).

## Strand discrimination
- In E. coli, **[[Dam methylase]]** methylates the A in every **GATC** sequence
- Just after replication the template strand is methylated but the new strand is **not yet**: the DNA is **[[Hemimethylated DNA|hemimethylated]]**
- After a few minutes the new strand is methylated too and the strands can no longer be told apart, so MMR has to act quickly

## The steps
1. **MutS** binds the mismatch, and **MutL** binds MutS (uses ATP)
2. DNA is **threaded through the MutS–MutL complex** in both directions at once, forming a loop
3. The complex meets a **MutH** bound at a hemimethylated GATC. **MutH cuts the unmethylated (new) strand** 5′ of the G in GATC
4. **DNA helicase II** and an **exonuclease** remove the new strand from the cut to past the mismatch
   - GATC on the 3′ side: exonuclease VII or RecJ (5′→3′)
   - GATC on the 5′ side: exonuclease I or exonuclease X (3′→5′)
5. **DNA polymerase III** (with SSB) fills the gap and **DNA ligase** seals it

> [!quote] Klug 12e, p. 354
> A series of E. coli gene products, MutH, MutL, and MutS, as well as exonucleases, DNA polymerase III, and DNA ligase, are involved in MMR.

> [!figure] Strand discrimination: after replication the new strand is briefly unmethylated at GATC (Lecture 15, slide 18)
> ![[mg15_s18.jpg]]

> [!figure] MutS binds the mismatch, MutL joins, MutH cuts the unmethylated strand at GATC (Lecture 15, slide 19)
> ![[mg15_s19.jpg]]

> [!figure] Exonucleases remove the new strand past the mismatch; DNA polymerase III fills the gap (Lecture 15, slide 20)
> ![[mg15_s20.jpg]]

## Questions
> [!question]- How does mismatch repair tell the new strand from the template strand in E. coli?
> The template strand is methylated at GATC sites but the new strand is not methylated yet (hemimethylated DNA), so the unmethylated strand is the new one.

> [!question]- What do MutS, MutL and MutH each do?
> MutS binds the mismatch; MutL binds MutS and the complex threads the DNA; MutH binds a hemimethylated GATC and cuts the unmethylated strand.

> [!question]- Where does MutH cut?
> The unmethylated (new) strand, 5′ of the G in the GATC sequence.

> [!question]- Why must mismatch repair happen soon after replication?
> After a few minutes Dam methylase methylates the new strand too, and the strands can no longer be distinguished.
