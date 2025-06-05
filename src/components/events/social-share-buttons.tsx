'use client';

import { Button } from '@/components/ui/button';
import { Share2, Twitter, Facebook, Linkedin } from 'lucide-react'; // Assuming Twitter is an X icon equivalent

interface SocialShareButtonsProps {
  url: string;
  title: string;
}

export default function SocialShareButtons({ url, title }: SocialShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const platforms = [
    {
      name: 'Twitter',
      icon: <Twitter className="h-4 w-4" />,
      link: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: 'Facebook',
      icon: <Facebook className="h-4 w-4" />,
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="h-4 w-4" />,
      link: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold font-headline flex items-center">
        <Share2 className="mr-2 h-5 w-5 text-primary" />
        Share this event
      </h3>
      <div className="flex space-x-2">
        {platforms.map((platform) => (
          <Button
            key={platform.name}
            variant="outline"
            size="icon"
            asChild
            className="hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label={`Share on ${platform.name}`}
          >
            <a href={platform.link} target="_blank" rel="noopener noreferrer">
              {platform.icon}
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}
