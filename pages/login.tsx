import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Register: NextPage = () => {
	const [register, setRegister] = useState(false);
	const [err, setErr] = useState("");
	const router = useRouter();
	return (
		<div>
			<Head>
				<title>OmegaSleep | {register ? "Register" : "Login"}</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="flex justify-center w-screen items-center h-screen dark:bg-slate-900 bg-white dark:text-white p-8">
				<div className="border-0 md:border-2 border-white border-solid rounded text-slate-900 dark:text-white w-full md:w-1/2 p-0 md:p-16">
					<button
						onClick={() => setRegister(!register)}
						className="w-full bg-gray-500 p-4 rounded mb-8"
					>
						Switch to {register ? "Login" : "Register"}
					</button>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							setErr("");
							fetch("/api/login", {
								method: "POST",
								headers: {
									"content-type": "application/json",
								},
								body: JSON.stringify({
									username: (e.target as any)[0].value,
									password: (e.target as any)[1].value,
									name: (e.target as any)[2].value,
								}),
							}).then((r) => {
								r.json().then((data) => {
									if (data.ok) {
										router.push("/");
									} else {
										setErr(data.error);
									}
								});
							});
						}}
					>
						<h1 className="text-3xl">{register ? "Register" : "Login"}</h1>
						<label className="hidden">Username</label>
						<input
							name="username"
							placeholder="Username"
							type="text"
							className="outline-none rounded p-4 w-full mt-4 dark:bg-slate-700 bg-slate-300"
						/>
						<label className="hidden">Password</label>
						<input
							name="password"
							placeholder="Password"
							type="password"
							className="outline-none rounded p-4 w-full mt-4 dark:bg-slate-700 bg-slate-300"
						/>
						{register ? (
							<input
								name="name"
								placeholder="Name"
								type="text"
								className="outline-none rounded p-4 w-full mt-4 dark:bg-slate-700 bg-slate-300"
							/>
						) : null}
						<p className="text-red">{err}</p>
						<input
							value={register ? "Register" : "Login"}
							type="submit"
							className="cursor-pointer outline-none rounded dark:text-black p-4 mt-8 w-full bg-green-600 dark:bg-green-300"
						/>
					</form>
				</div>
			</main>
		</div>
	);
};

export default Register;
