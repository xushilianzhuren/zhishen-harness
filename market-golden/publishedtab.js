			/** v3.7 已发布Tab：xushilianzhuren名下dsh-*件·星数/更新/仓库链/一键安装 */
			function PublishedTab(props) {
				const d0 = react.useState(null); const data = d0[0]; const setData = d0[1];
				const e0 = react.useState(""); const err = e0[0]; const setErr = e0[1];
				const s0 = react.useState(Date.now()); const stamp = s0[0]; const setStamp = s0[1];
				const load = react.useCallback(() => {
					(async () => {
						try {
							const res = await fetch("https://api.github.com/users/xushilianzhuren/repos?per_page=100");
							if (!res.ok) throw new Error("HTTP " + res.status);
							const rows = await res.json();
							setData(rows.filter(r => r.name.indexOf("dsh-") === 0));
							setStamp(Date.now());
						} catch (e) { setErr(String(e && e.message || e)); }
					})();
				}, []);
				react.useEffect(() => { load(); }, [load]);
				if (err) return El("div", null,
					El("p", { className: styles_module_css_default.stateHint }, "加载失败：" + err),
					El("button", { onClick: load, style: { fontSize: "12px", padding: "4px 12px", borderRadius: "8px", border: "1px solid #8886", background: "transparent", color: "inherit" } }, "重试")
				);
				if (!data) return El("p", { className: styles_module_css_default.stateHint }, "加载中…");
				return El("div", null,
					El("div", { style: { display: "flex", justifyContent: "space-between", padding: "4px 8px" } },
						El("span", { className: styles_module_css_default.stateHint }, "共 " + data.length + " 件"),
						El("button", { onClick: load, style: { fontSize: "12px", padding: "2px 10px", borderRadius: "8px", border: "1px solid #8886", background: "transparent", color: "inherit" } }, "刷新")
					),
					data.map(r =>
						El("div", { key: r.full_name, style: { padding: "10px 12px", borderBottom: "1px solid #8883" } },
							El("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
								El("strong", { style: { fontSize: "14px" } }, r.name),
								El("span", { style: { fontSize: "12px", color: "#eab308" } }, "★ " + (r.stargazers_count ?? 0))
							),
							El("div", { style: { fontSize: "12px", color: "#888", margin: "2px 0 6px" } }, (r.description || "").slice(0, 60) + " · " + (r.updated_at || "").slice(0, 10)),
							El("div", null,
								El("a", { href: r.html_url, target: "_blank", style: { fontSize: "12px", color: "#2563eb", textDecoration: "none", marginRight: "10px" } }, "打开仓库"),
								El("button", { onClick: () => { try { props.onInstall && props.onInstall({ id: r.full_name, name: r.name, fullName: r.full_name, type: "cordis-plugin", stars: r.stargazers_count, description: r.description || "" }); } catch (e) {} }, style: { fontSize: "12px", padding: "2px 10px", borderRadius: "8px", border: "1px solid #8886", background: "transparent", color: "inherit" } }, "安装")
							)
						)
					)
				);
			}
