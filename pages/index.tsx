import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import datapoint from "../db/models/datapoint";
import { auth } from "./api/login";
import { useRouter } from "next/router";
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
import Group from "./group/[id]";
import group from "../db/models/group";
import Link from "next/link";

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
	groups: { id: string; name: string }[];
	invited: { id: string; name: string }[];
}) => {
	const [copied, setCopied] = useState(false);
	const [newGroup, setNewGroup] = useState("");
	const router = useRouter();
	return (
		<div className="dark:text-white">
			<Head>
				<title>OmegaSleep</title>
			</Head>
			<div className="w-full flex justify-center flex items-center">
				<div className="w-full p-8 md:w-2/3 xl:w-1/2">
					<div className="flex gap-4">
						<input
							readOnly
							type="text"
							value={props.apiToken}
							className=" outline-none w-full p-4 bg-slate-300 dark:bg-slate-800"
						/>
						<button
							onClick={() => {
								navigator.clipboard.writeText(props.apiToken);
								setCopied(true);
								setTimeout(() => setCopied(false), 1000);
							}}
							className="bg-green-500 p-4"
						>
							{copied ? "Copied" : "Copy"}
						</button>
					</div>
					<div className="mt-20">
						<Line
							data={{
								labels: props.data.map((d) => {
									const added = new Date(d.added);
									return added.getDate() + "-" + (added.getMonth() + 1);
								}),
								datasets: [
									{
										data: props.data.map((d) => d.value / 3600),
										label: "Sleep in hours",
										borderColor: "cyan",
									},
								],
							}}
						/>
					</div>
					{props.invited.length ? (
						<>
							<h1 className="text-3xl text-center">Your Invitations</h1>
							<div className="flex mt-10 gap-5">
								{props.invited.map((invited, i) => (
									<button
										onClick={() => {
											fetch("/api/join", {
												method: "POST",
												headers: {
													"Content-Type": "application/json",
												},
												body: JSON.stringify({
													id: invited.id,
												}),
											}).then((r) => {
												r.json().then((data) => {
													if (data.ok) {
														router.push(
															"/group/" + encodeURIComponent(invited.id)
														);
													}
												});
											});
										}}
										key={i}
										className="p-4 bg-green-500 hover:bg-green-400"
									>
										Join {invited.name}
									</button>
								))}
							</div>
						</>
					) : null}
					<h1 className="text-3xl mt-10 text-center">Your Groups</h1>
					<div className="flex flex-wrap mt-10 gap-5">
						{props.groups.map((g, i) => (
							<Link key={i} href={"/group/" + g.id} passHref>
								<div className="bg-slate-500 hover:bg-slate-400 p-4 cursor-pointer">
									{g.name}
								</div>
							</Link>
						))}
					</div>
					<div className="flex gap-4 w-full mt-10">
						<input
							onChange={({ target: { value } }) => setNewGroup(value)}
							value={newGroup}
							type="text"
							placeholder="Group Name"
							className="bg-blue-500 w-full p-4 hover:bg-blue-400 transition-colors outline-none"
						/>
						<button
							onClick={() => {
								fetch("/api/createGroup", {
									method: "POST",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({
										name: newGroup,
									}),
								}).then((r) => {
									r.json().then((d) => {
										if (d.ok) {
											router.push("/group/" + d.result);
										}
									});
								});
							}}
							className="bg-blue-600 hover:bg-blue-500 transition-colors p-4"
						>
							Create
						</button>
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
					group.find({ users: { $in: [usr._id] } }).then((groups) => {
						group.find({ invited: { $in: [usr._id] } }).then((invited) => {
							res({
								props: {
									apiToken: usr.apiKey,
									data: data.map((d) => ({
										id: d._id.toString(),
										value: d.value,
										added: (d.added as Date).getTime(),
									})),
									groups: groups.map((g) => ({
										name: g.name,
										id: g._id.toString(),
									})),
									invited: invited.map((g) => ({
										name: g.name,
										id: g._id.toString(),
									})),
								},
							});
						});
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
