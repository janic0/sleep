import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import datapoint from "../db/models/datapoint";
import { auth } from "./api/login";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
);

const Home = (props: {
	apiToken: string;
	data: { value: number; added: string }[];
}) => {
	const [copied, setCopied] = useState(false);
	return (
		<div className="dark:text-white">
			<Head>
				<title>OmegaSleep</title>
			</Head>
			<div className="w-full flex justify-center h-screen flex items-center">
				<div className="w-full p-8 md:w-2/3 xl:w-1/2">
					<div className="flex gap-4">
						<input
							readOnly
							type="text"
							value={props.apiToken}
							className=" outline-none w-full p-4 bg-slate-300 rounded dark:bg-slate-800"
						/>
						<button
							onClick={() => {
								navigator.clipboard.writeText(props.apiToken);
								setCopied(true);
								setTimeout(() => setCopied(false), 1000);
							}}
							className="bg-green-500 p-4 rounded"
						>
							{copied ? "Copied" : "Copy"}
						</button>
					</div>
					<div className="mt-20">
						<Line
							data={{
                labels: props.data.map(d => {
                  const added = new Date(d.added)
                  return added.getDate() + "-" + (added.getMonth() + 1)
                }),
								datasets: [
									{
										data: props.data.map((d) => d.value / 3600),
										label: "Sleep in hours",
                    borderColor: 'cyan',
									},
								],
							}}
						></Line>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Home;

export const getServerSideProps: GetServerSideProps = (ctx) => {
	return new Promise((res) => {
		auth(ctx.req as any).then((usr) => {
			if (usr) {
				datapoint.find({ user: usr._id }).then((data) => {
					res({
						props: {
							apiToken: usr.apiKey,
							data: data.map((d) => ({
								id: d._id.toString(),
								value: d.value,
								added: (d.added as Date).toISOString(),
							})),
						},
					});
				});
			} else {
				res({
					redirect: {
						destination: "/login",
						permanent: false,
					},
				});
			}
		});
	});
};
