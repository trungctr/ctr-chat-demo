function SuLyLoat(mainCheckboxId, submitActionBtnId, itemCheckboxName, containerFormId) {
	//chọn tất cả
	var checkboxAll = $("#" + mainCheckboxId)
	var submitActionBtn = $("#" + submitActionBtnId)
	var itemCheckbox = $('input[name="' + itemCheckboxName + '"]')//chọn toàn bộ check box hiện có
	var actionFrom = $("#" + containerFormId)
	checkboxAll.change(function () {
		var isCheckedAll = $(this).prop('checked')
		itemCheckbox.prop('checked', isCheckedAll)
		submitActionBtn.prop('disabled', !isCheckedAll)
	})
	itemCheckbox.change(function () {
		var itemChecked = $('input[name="' + itemCheckboxName + '"]:checked')//chọn các check box đã check
		var isItemCheckedAll = itemCheckbox.length === itemChecked.length
		console.log('số checkbox hiện có:', itemCheckbox.length)
		console.log('số item đã check:', itemChecked.length)
		console.log('tất cả đã check:', isItemCheckedAll)
		checkboxAll.prop('checked', isItemCheckedAll)
		if (itemChecked.length > 0)
		{
			submitActionBtn.prop('disabled', false)
		} else
		{
			submitActionBtn.prop('disabled', true)
		}
	})
	submitActionBtn.click(function () {
		actionFrom.submit()
	})
}
//tổng các phần tử mảng
function sumArray(a) {
	let sum = 0;
	for (let i = 0;i < a.length;i++)
	{
		sum += a[i];
	};
	return sum;
}
//tính %
function percentage(num, total) {
	percent = (num / total) * 100
	return percent.toFixed(2)
}

//tạo mới token
function checkPoint() {
	document.addEventListener('DOMContentLoaded', function () {
		setInterval(check, 10 * 60 * 1000)
		async function check() {
			var d = new Date()
			d.setTime(d.getTime() + (15 * 24 * 60 * 60 * 1000))
			e = d.toUTCString()
			//dùng axios gọi ajax
			await axios({
				method: "get",
				url: "/auth/refresh",
				responseType: "json"
			})
				.then(function (res) {
					document.cookie = `ctrdata1 = ${ res.data }; expires = ${ e } ;path = /`
				})
				.catch(function (error) {
					console.log("Lỗi: " + error)
				})
				.finally(function () {
					console.log("check point done!")
				})
		}
	})
}

//hàm sleep
function sleep(time) {
	function counter() {
		console.log(time)
		time--
		if (time == -1)
		{
			clearInterval(countdown)
		}
	}
	var countdown = setInterval(counter, 1000)
}

//ẩn hiện thanh điều hướng
function navbartoggle(showbtnId, hidebtnId, navId) {
	var showBtn = document.getElementById(showbtnId)
	var hideBtn = document.getElementById(hidebtnId)
	var nav = document.getElementById(navId)
	showBtn.onclick = function (e) {
		e.preventDefault()
		nav.classList.remove("--hidden")
		showBtn.classList.add("--hidden")
	}
	hideBtn.onclick = function (e) {
		e.preventDefault()
		nav.classList.add("--hidden")
		showBtn.classList.remove("--hidden")
	}
}

//ẩn hiện nhóm menu
function menutoggle(titleId, listId) {
	var title = document.getElementById(titleId)
	var list = document.getElementById(listId)
	title.onclick = function (e) {
		e.preventDefault()
		var show = list.getAttribute('show-status')
		if (show == 'true')
		{
			list.classList.add("--hidden")
			list.setAttribute('show-status', 'false')
		} else
		{
			list.classList.remove("--hidden")
			list.setAttribute('show-status', 'true')
		}
	}
}
//trở về trang trước
function historyBack() {
	history.back()
}

//cân bằng layout
function fitLayout(headerID, containerID, wrapperID, footerID) {
	let head = document.getElementById(headerID)
	let container = document.getElementById(containerID)
	let wrapper = document.getElementById(wrapperID)
	let foot = document.getElementById(footerID)
	let headHeight = head.offsetHeight
	let footHeight = foot.offsetHeight
	container.style.top = headHeight + 'px'
	wrapper.style.paddingBottom = footHeight + 'px'
}

function layoutBalancer(headerID, containerID, wrapperID, footerID) {
	window.addEventListener('resize', () => {
		fitLayout(headerID, containerID, wrapperID, footerID)
	}, 200, false)
}
//fullscreen
function fullscreen() {
	var el = document.documentElement
		, rfs = // for newer Webkit and Firefox
			el.requestFullscreen
			|| el.webkitRequestFullScreen
			|| el.mozRequestFullScreen
			|| el.msRequestFullscreen
		;
	if (typeof rfs != "undefined" && rfs)
	{
		rfs.call(el);
	} else if (typeof window.ActiveXObject != "undefined")
	{
		// for Internet Explorer
		var wscript = new ActiveXObject("WScript.Shell");
		if (wscript != null)
		{
			wscript.SendKeys("{F11}");
		}
	}
}
// thoát toàn hình
function outfullscreen() {
	var el = document
		, rfs = // for newer Webkit and Firefox
			el.cancelFullScreen
			|| el.webkitCancelFullScreen
			|| el.mozRequestFullScreen
			|| el.msRequestFullscreen
		;
	if (typeof rfs != "undefined" && rfs)
	{
		rfs.call(el);
	} else if (typeof window.ActiveXObject != "undefined")
	{
		// for Internet Explorer
		var wscript = new ActiveXObject("WScript.Shell");
		if (wscript != null)
		{
			wscript.SendKeys("{F11}");
		}
	}
}
//hiển thị biểu đồ donut
function renderChart(dataArray, chartContainer, dlegend = false, dtitle = false) {
	var xValues = [
		'Đã hoàn thành',
		'Đang tiến hành',
		'Chậm tiến độ',
		'Chưa tiến hành',
		'Tạm dừng',
		'Hoàn thành quá hạn'
	]
	var yValues = dataArray;
	var barColors = [
		"rgb(68, 114, 196)", // đã hoàn thành
		"rgb(112, 173, 71)", // đang tiến hành
		"rgb(255, 0, 0)", // quá hạn
		"gray", // chưa làm
		"rgb(255, 192, 0)", // tạm dừng
		"rgb(0, 0, 0)", // bad completed
	];

	new Chart(chartContainer, {
		type: "doughnut",
		data: {
			labels: xValues,
			datasets: [{
				backgroundColor: barColors,
				data: yValues
			}]
		},
		options: {
			legend: {
				display: dlegend,
			},
			title: {
				display: dtitle,
				text: "tình trạng"
			}
		}
	})
}

//render item box
function renderProject(box, itemType, chartData, id) {
	var container = document.getElementById(box)
	var element = `
	<div class="schedule__item-box --${ itemType }-box project-box" id="schedule-item-box-${ id }" name="schedule-item-box">
		<div class="schedule__item-title --${ itemType }-bg" id="schedule-item-title" name="schedule-item-title"
			id="schedule-item-title">
			Dự án ${ id } 
			<span class="completed-percent --hidden project-completed-percent">- (${ percentage(chartData[0], sumArray(chartData)) }%)</span>
		</div>
		<div class="schedule__data-frame --${ itemType }-dt project-data">
			<div class="schedule__data-column-1">
				<div class="schedule__data-field">Ex. Unit: Workshop 1</div>
				<div class="schedule__data-field">Charge: PM Name</div>
				<div class="schedule__data-field">Start date: 31/12/2021 23:59</div>
				<div class="schedule__data-field">Dead line: 31/12/2021 23:59</div>
				<div class="schedule__data-field">Finish date: 31/12/2021 23:59</div>
			</div>
			<div class="schedule__data-column-2">
				<div class="schedule__data-field"><span class="schedule__chart-legend --good-completed-bg"></span>Đã hoàn
					thành ${ chartData[0] }/${ sumArray(chartData) }
					(${ percentage(chartData[0], sumArray(chartData)) }%)</div>
				<div class="schedule__data-field"><span class="schedule__chart-legend --in-process-bg"></span>Đang tiến hành
					${ chartData[1] }/${ sumArray(chartData) }
					(${ percentage(chartData[0], sumArray(chartData)) }%)</div>
				<div class="schedule__data-field"><span class="schedule__chart-legend --out-of-schedule-bg"></span>Chậm tiến
					độ ${ chartData[2] }/${ sumArray(chartData) } (${ percentage(chartData[2], sumArray(chartData)) }%)</div>
				<div class="schedule__data-field"><span class="schedule__chart-legend --await-bg"></span>Chưa tiến hành
					${ chartData[3] }/${ sumArray(chartData) } (${ percentage(chartData[3], sumArray(chartData)) }%)
				</div>
				<div class="schedule__data-field"><span class="schedule__chart-legend --on-holding-bg"></span>Tạm dừng
					${ chartData[4] }/${ sumArray(chartData) } (${ percentage(chartData[4], sumArray(chartData)) }%)
				</div>
				<div class="schedule__data-field"><span class="schedule__chart-legend --bad-completed-bg"></span>Hoàn thành
					muộn
					${ chartData[5] }/${ sumArray(chartData) } (${ percentage(chartData[5], sumArray(chartData)) }%)
				</div>
			</div>
			<div class="schedule__data-column-2">
				<div class="schedule__chart-container" id="chartBox-${ id }">
					<canvas class='schedule__chart' id="chart-${ id }"></canvas>
				</div>
			</div>
		</div>
	</div>`
	var divider = `<divider class='space' style='height:20px'>______</divider>`
	container.insertAdjacentHTML('beforeend', element)
	let j = document.createElement('script')
	j.textContent = `renderChart([${ chartData }], 'chart-${ id }')`
	document.getElementById(`chartBox-${ id }`).appendChild(j)
	container.insertAdjacentHTML('beforeend', divider)
}
function renderChildTask(box, itemType, chartData, id) {
	var container = document.getElementById(box)
	var element = `
	<div class="schedule__item-box --${ itemType }-box child-box" id="schedule-item-box-${ id }" name="schedule-item-box">
		<div class="schedule__item-title --${ itemType }-bg childTitle" id="schedule-item-title" name="schedule-item-title"
			id="schedule-item-title">
			Hạng mục ${ id }
			<i class="bi bi-circle-half vendoring"></i>
			<i class="bi bi-circle-fill vendored"></i>
			<span class="completed-percent --hidden child-completed-percent">- ${ percentage(chartData[0], sumArray(chartData)) }%</span>
		</div>
		<div class="schedule__data-frame --${ itemType }-dt child-data">
			<div class="schedule__data-column-1">
				<div class="schedule__data-field">Ex. Unit: Workshop 1</div>
				<div class="schedule__data-field">Charge: PM Name</div>
				<div class="schedule__data-field">Start date: 31/12/2021 23:59</div>
				<div class="schedule__data-field">Dead line: 31/12/2021 23:59</div>
				<div class="schedule__data-field">Finish date: 31/12/2021 23:59</div>
			</div>
			<div class="schedule__data-column-2">
				<div class="schedule__data-field"><span class="schedule__chart-legend --good-completed-bg"></span>Đã hoàn
					thành ${ chartData[0] }/${ sumArray(chartData) }
					(${ percentage(chartData[0], sumArray(chartData)) }%)</div>
				<div class="schedule__data-field"><span class="schedule__chart-legend --in-process-bg"></span>Đang tiến hành
					${ chartData[1] }/${ sumArray(chartData) }
					(${ percentage(chartData[0], sumArray(chartData)) }%)</div>
				<div class="schedule__data-field"><span class="schedule__chart-legend --out-of-schedule-bg"></span>Chậm tiến
					độ ${ chartData[2] }/${ sumArray(chartData) } (${ percentage(chartData[2], sumArray(chartData)) }%)</div>
				<div class="schedule__data-field"><span class="schedule__chart-legend --await-bg"></span>Chưa tiến hành
					${ chartData[3] }/${ sumArray(chartData) } (${ percentage(chartData[3], sumArray(chartData)) }%)
				</div>
				<div class="schedule__data-field"><span class="schedule__chart-legend --on-holding-bg"></span>Tạm dừng
					${ chartData[4] }/${ sumArray(chartData) } (${ percentage(chartData[4], sumArray(chartData)) }%)
				</div>
				<div class="schedule__data-field"><span class="schedule__chart-legend --bad-completed-bg"></span>Hoàn thành
					muộn
					${ chartData[5] }/${ sumArray(chartData) } (${ percentage(chartData[5], sumArray(chartData)) }%)
				</div>
			</div>
			<div class="schedule__data-column-2">
				<div class="schedule__chart-container" id="chartBox-${ id }">
					<canvas class='schedule__chart' id="chart-${ id }"></canvas>
				</div>
			</div>
		</div>
	</div>`
	container.insertAdjacentHTML('beforeend', element)
	let j = document.createElement('script')
	j.textContent = `renderChart([${ chartData }], 'chart-${ id }')`
	document.getElementById(`chartBox-${ id }`).appendChild(j)
}

// chú thích menu
// function menuNotesRender(menu1,menu2) {
// 	const notes = menu1.concat(menu2)
// 	var main_menu = document.getElementById('main-menu')
// 	main_menu.addEventListener('mousemove', function () {
// 		var buttons = document.getElementsByClassName('nav-menu__opt')
// 		//console.log(buttons)
// 		for (var i = 0;i < buttons.length;i++)
// 		{
// 			var b = buttons[i]
// 			b.onmouseover = function (e) {
// 				var node = document.getElementById(e.target.parentNode.getAttribute('id'))
// 				var noteContent
// 				if (node.getAttribute('id').split('-')[0]=='view') {
// 					noteContent = Number(node.getAttribute('id').split('-')[1]) + menu1.length - 1
// 				} else{
// 					noteContent = Number(node.getAttribute('id').split('-')[1]) - 1
// 				}
// 				var note = document.createElement('div')
// 				note.id = 'main-nav-menu__note'
// 				note.style.top = (node.offsetTop + node.offsetHeight) + 'px'
// 				note.style.left = node.offsetLeft + 'px'
// 				note.textContent = notes[noteContent]
// 				note.classList.add('main-menu__note')
// 				main_menu.appendChild(note)
// 			}
// 			b.onmouseout = function (e) {
// 				main_menu.removeChild(document.getElementById('main-nav-menu__note'))
// 			}
// 		}
// 	})
// }