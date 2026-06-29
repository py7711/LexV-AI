import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeVoiceBlogPostPage, blogPosts, getBlogPost } from "@/components/devoice-static-page";
import { isLocale, localizedPath, locales, siteUrl, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string; post: string }>;
};

export async function generateStaticParams() {
  return blogPosts.flatMap((post) => locales.map((locale) => ({ locale, post: post.slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, post: slug } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }

  const post = getBlogPost(slug);
  if (!post) {
    return {};
  }

  const locale = rawLocale as Locale;
  const canonical = `${siteUrl}${localizedPath(locale, `blog/${post.slug}`)}`;
  const title = post.title.includes("| DeVoice") ? post.title : `${post.title} | DeVoice`;

  return {
    title,
    description: post.excerpt,
    alternates: {
      canonical,
      languages: Object.fromEntries(locales.map((item) => [item, `${siteUrl}${localizedPath(item, `blog/${post.slug}`)}`]))
    },
    openGraph: {
      type: "article",
      url: canonical,
      siteName: "DeVoice",
      title,
      description: post.excerpt,
      locale
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.excerpt
    }
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale: rawLocale, post: slug } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const post = getBlogPost(slug);
  if (!post) {
    notFound();
  }

  return <DeVoiceBlogPostPage locale={rawLocale as Locale} post={post} />;
}
