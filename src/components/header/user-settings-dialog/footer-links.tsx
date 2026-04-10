"use client";

import { useState } from "react";
import { File, GitCompare, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AboutDialog } from "./about-dialog";
import { TermsDialog } from "./terms-dialog";

export function UserSettingsFooterLinks() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <>
      <div className="flex w-full flex-wrap items-center justify-center gap-x-1 gap-y-2 sm:justify-around">
        <Button
          variant="link"
          size="sm"
          className="text-secondary"
          onClick={() => setAboutOpen(true)}
        >
          <Info />
          About
        </Button>
        <Button variant="link" size="sm" className="text-secondary">
          <GitCompare />
          <Link href="https://github.com/AllexKzk/chait" target="_blank">
            Source
          </Link>
        </Button>
        <Button
          variant="link"
          size="sm"
          className="text-secondary"
          onClick={() => setTermsOpen(true)}
        >
          <File />
          Terms
        </Button>
      </div>

      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
      <TermsDialog open={termsOpen} onOpenChange={setTermsOpen} />
    </>
  );
}
