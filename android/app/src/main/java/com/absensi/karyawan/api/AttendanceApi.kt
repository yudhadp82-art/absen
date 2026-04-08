package com.absensi.karyawan.api

import com.absensi.karyawan.model.AttendanceHistory
import com.absensi.karyawan.model.AttendanceRequest
import com.absensi.karyawan.model.AttendanceResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface AttendanceApi {

    @POST("attendance")
    suspend fun submitAttendance(
        @Body request: AttendanceRequest
    ): Response<AttendanceResponse>

    @GET("attendance")
    suspend fun getAttendanceHistory(
        @Query("employeeId") employeeId: String?,
        @Query("date") date: String? = null
    ): Response<AttendanceHistory>
}
