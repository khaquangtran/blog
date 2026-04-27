import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from "next-mdx-remote/rsc";
import Figure from "@/app/components/figure";
import Link from "next/link";
import Image from "next/image";

const components = { Figure }

export default async function Page({ params }: { params: { year: string; slug: string } }) {
    const { year, slug } = await params;

    const filePath = path.join(
        process.cwd(),
        `articles/${year}`,
        `${slug}.mdx`
    );

    const source = fs.readFileSync(filePath, 'utf8');

    const { content, data } = matter(source);

    return (
        <div className={"font-mono"}>
            <header className={"max-w-2xl mx-auto px-4"}>
                <div className={"py-5 border-btm"}>
                    <Link href={"/"} className={"link"}>
                        <div className={"flex items-center gap-2"}>
                            <Image src={"/arrow-left.svg"} alt={"arrow-left"} width={12} height={12} className={"invert-100"} />
                            <span>Home</span>
                        </div>
                    </Link>
                    <div className={"mt-6"}>
                        <h1 className={"font-bold"}>{data.title}</h1>
                        <p className={"mt-2"}>{data.date}</p>
                    </div>
                </div>
            </header>
            <section id={"article"} className={"max-w-2xl mx-auto px-4"}>
                <div className={"mt-6"}>
                    <MDXRemote source={content} components={components} />
                </div>
            </section>
        </div>
    );
}