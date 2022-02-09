import { GetServerSideProps } from "next";
import group from "../../db/models/group";
import user from "../../db/models/user";
import { auth } from "../api/login";

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
import datapoint from "../../db/models/datapoint";
import { useEffect, useState } from "react";
import Head from "next/head";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
);

const Group = (props: {
	group: {
		id: string;
		name: string;
		isOwner: boolean;
		me: string;
		invited: { id: string; name: string }[];
		users: {
			name: string;
			color: string;
			id: string;
			datapoints: { timestamp: number; value: number }[];
		}[];
	};
}) => {
	const [invited, setInvited] = useState(props.group.invited);
	const [members, setMembers] = useState(props.group.users);
	const [average, setAverage] = useState<
		{ name: string; value: number; color: string }[]
	>([]);
	const [totalAverage, setTotalAverage] = useState(0);
	const [newUsername, setNewUsername] = useState("");
	const [labels, setLabels] = useState<
		{
			timestamp: number;
			formatted: string;
		}[]
	>([]);
	const [datasets, setDatasets] = useState<
		{
			label: string;
			data: (number | undefined)[];
			borderColor: string;
		}[]
	>([]);
	useEffect(() => {
		let labels: {
			timestamp: number;
			formatted: string;
		}[] = [];
		const addedFormatted: string[] = [];
		const averages: { name: string; value: number; color: string }[] = [];
		const datasets: {
			data: (number | undefined)[];
			label: string;
			borderColor: string;
		}[] = [];
		props.group.users.forEach((user) => {
			const userAverage =
				user.datapoints.reduce((acc, curr) => acc + curr.value, 0) /
				user.datapoints.length;
			averages.push({ name: user.name, value: userAverage, color: user.color });
			user.datapoints.forEach((dp) => {
				const formatted = new Date(dp.timestamp).toLocaleDateString();
				if (!addedFormatted.includes(formatted)) {
					addedFormatted.push(formatted);
					labels.push({
						timestamp: dp.timestamp,
						formatted,
					});
				}
			});
		});
		labels.sort((a, b) => a.timestamp - b.timestamp);
		props.group.users.forEach((user) => {
			const current: {
				data: (number | undefined)[];
				label: string;
				borderColor: string;
			} = { label: user.name + "'s sleep", data: [], borderColor: user.color };
			labels.forEach((label) => {
				const value = user.datapoints.find(
					(u) => new Date(u.timestamp).toLocaleDateString() === label.formatted
				);
				if (value) {
					current.data.push(value.value / 3600);
				} else {
					current.data.push(undefined);
				}
			});
			datasets.push(current);
		});
		setLabels(labels);
		setAverage(averages);
		setTotalAverage(average.reduce((acc, curr) => acc + curr.value, 0));
		setDatasets(datasets);
	}, [props.group.users]);
	return (
		<div className="dark:text-white flex justify-center mt-10">
			<Head>
				<title>OmegaSleep | {props.group.name}</title>
			</Head>
			<div className="w-full p-4 md:p-0 md:w-1/2">
				<h1 className="text-2xl md:text-6xl font-bold text-center">
					{props.group.name}
				</h1>
				<div className="flex flex-wrap justify-center gap-5 mt-10">
					{props.group.users.map((user, i) => (
						<h1 className="bg-slate-500 p-4 whitespace-pre" key={i}>
							🤦‍♀️ {"  " + user.name}
							{props.group.isOwner && user.id !== props.group.me ? (
								<button
									onClick={() => {
										if (!confirm("remove " + user.name + "?")) return;
										fetch("/api/removeMember", {
											method: "POST",
											headers: {
												"Content-Type": "application/json",
											},
											body: JSON.stringify({
												id: props.group.id,
												user: user.id,
											}),
										}).then((r) => {
											r.json().then((data) => {
												if (data.ok) {
													setMembers(members.filter((m) => m.id !== user.id));
													setInvited(invited.filter((m) => m.id !== user.id));
												}
											});
										});
									}}
									className="ml-4 px-2 rounded bg-red-500"
								>
									X
								</button>
							) : null}
						</h1>
					))}
				</div>
				<div className="flex flex-wrap justify-center gap-5 mt-4">
					{props.group.invited.map((user, i) => (
						<h1 className="bg-slate-500 p-4 whitespace-pre" key={i}>
							🕣{"  " + user.name}
							{props.group.isOwner && user.id !== props.group.me ? (
								<button
									onClick={() => {
										fetch("/api/removeMember", {
											method: "POST",
											headers: {
												"Content-Type": "application/json",
											},
											body: JSON.stringify({
												id: props.group.id,
												user: user.id,
											}),
										}).then((r) => {
											r.json().then((data) => {
												if (data.ok) {
													setMembers(members.filter((m) => m.id !== user.id));
													setInvited(invited.filter((m) => m.id !== user.id));
												}
											});
										});
									}}
									className="ml-4  p-2 bg-red-500"
								>
									X
								</button>
							) : null}
						</h1>
					))}
				</div>
				{props.group.isOwner ? (
					<div className="flex gap-4 mt-10">
						<input
							onChange={(e) => setNewUsername(e.target.value)}
							value={newUsername}
							type="text"
							placeholder="add user"
							className="w-full dark:bg-slate-800 bg-slate-200 p-4 outline-none"
						/>
						<button
							onClick={() => {
								fetch("/api/invite", {
									method: "POST",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({
										id: props.group.id,
										name: newUsername,
									}),
								}).then((r) => {
									r.json().then((data) => {
										if (data.ok) {
											setInvited([
												...invited,
												{ id: data.result, name: newUsername },
											]);
											setNewUsername("");
										}
									});
								});
							}}
							className="p-4 bg-blue-500 hover:bg-blue-400"
						>
							add
						</button>
					</div>
				) : null}
				{average.length ? (
					<div className="flex w-full divide-x-2 mt-5">
						{average.map((user) => {
							console.log((100 / totalAverage) * user.value);
						})}
						{average.map((user, i) => (
							<div
								key={i}
								className=" p-4"
								style={{
									width: (100 / totalAverage) * user.value + "%",
									backgroundColor: user.color,
								}}
							>
								{user.name}
							</div>
						))}
					</div>
				) : null}
				<h1 className="text-2xl md:text-3xl text-center mt-10">Sleep Data</h1>
				<div className="mt-10">
					<Line
						data={{
							labels: labels.map((label) => label.formatted),
							datasets: datasets,
						}}
					/>
				</div>
			</div>
		</div>
	);
};

export default Group;

export const getServerSideProps: GetServerSideProps = (ctx) => {
	return new Promise((res) => {
		auth(ctx.req as any).then((usr) => {
			if (usr) {
				if (!ctx.params)
					return res({
						redirect: {
							permanent: false,
							destination: "/",
						},
					});
				return group
					.findOne({
						users: { $in: [usr._id] },
						_id: ctx.params.id,
					})
					.then((g) => {
						if (g) {
							const users: {
								name: string;
								color: string;
								id: string;
								datapoints: { timestamp: number; value: number }[];
							}[] = [];
							g.users.forEach((u: string) => {
								user.findById(u).then((uname) => {
									datapoint.find({ user: u }).then((data) => {
										users.push({
											name: uname.username,
											color: uname.color,
											id: uname._id.toString(),
											datapoints: data.map((dp) => ({
												timestamp: new Date(dp.added).getTime(),
												value: dp.value,
											})),
										});
										if (users.length === g.users.length) {
											const invited: { id: string; name: string }[] = [];
											if (g.invited && g.invited.length > 0) {
												g.invited.forEach((invite: string) => {
													user.findById(invite).then((invitee) => {
														invited.push({
															id: invitee._id.toString(),
															name: invitee.username,
														});
														if (invited.length === g.invited.length) {
															return res({
																props: {
																	group: {
																		id: g._id.toString(),
																		name: g.name,
																		users: users,
																		invited: invited,
																		me: usr._id.toString(),
																		isOwner:
																			g.owner.toString() === usr._id.toString(),
																	},
																},
															});
														}
													});
												});
											} else {
												res({
													props: {
														group: {
															id: g._id.toString(),
															name: g.name,
															users,
															invited: [],
															me: usr._id.toString(),
															isOwner:
																g.owner.toString() === usr._id.toString(),
														},
													},
												});
											}
										}
									});
								});
							});
						} else {
							res({
								redirect: {
									destination: "/",
									permanent: false,
								},
							});
						}
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
