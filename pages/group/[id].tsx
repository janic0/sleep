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
		invited: string[];
		users: {
			name: string;
			datapoints: { timestamp: number; value: number }[];
		}[];
	};
}) => {
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
			data: number[] | undefined[];
			borderColor: string;
		}[]
	>([]);
	useEffect(() => {
		let labels: {
			timestamp: number;
			formatted: string;
		}[] = [];
		const addedFormatted: string[] = [];
		const datasets: {
			data: number[] | undefined[];
			label: string;
			borderColor: string;
		}[] = [];
		props.group.users.forEach((user) => {
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
				data: number[];
				label: string;
				borderColor: string;
			} = { label: user.name + "'s sleep", data: [], borderColor: "red" };
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
		setDatasets(datasets);
	}, [props.group.users]);
	return (
		<div className="dark:text-white flex justify-center mt-10">
			<div className="w-full p-4 md:p-0 md:w-1/2">
				<h1 className="text-2xl md:text-6xl font-bold text-center">
					{props.group.name}
				</h1>
				<div className="flex flex-wrap justify-center gap-5 mt-10">
					{props.group.users.map((user, i) => (
						<h1 className="bg-slate-500 p-4 whitespace-pre" key={i}>
							🤦‍♀️ {"  " + user.name}
						</h1>
					))}
				</div>
				<div className="flex flex-wrap justify-center gap-5 mt-4">
					{props.group.invited.map((user, i) => (
						<h1 className="bg-slate-500 p-4 whitespace-pre" key={i}>
							🕣{"  " + user}
						</h1>
					))}
				</div>
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
										props.group.invited.push(newUsername);
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
								datapoints: { timestamp: number; value: number }[];
							}[] = [];
							g.users.forEach((u: string) => {
								user.findById(u).then((uname) => {
									datapoint.find({ user: u }).then((data) => {
										users.push({
											name: uname.username,
											datapoints: data.map((dp) => ({
												timestamp: new Date(dp.added).getTime(),
												value: dp.value,
											})),
										});
										if (users.length === g.users.length) {
											const invited: string[] = [];
											if (g.invited && g.invited.length > 0) {
												g.invited.forEach((invite: string) => {
													user.findById(invite).then((invitee) => {
														invited.push(invitee.username);
														if (invited.length === g.invited.length) {
															return res({
																props: {
																	group: {
																		id: g._id.toString(),
																		name: g.name,
																		users: users,
																		invited: invited,
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
